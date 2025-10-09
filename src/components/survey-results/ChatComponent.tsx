import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { authenticatedFetch } from "@/utils/api";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Send, X, BarChart3, Eye, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageDetailsPanel } from "@/components/chat/MessageDetailsPanel";
import { InlineDataSnapshot } from "@/components/chat/InlineDataSnapshot";
import { Survey } from "@/types/survey";
import { FileSelectionComponent } from "./FileSelectionComponent";
import { useTranslation } from "@/resources/i18n";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  dataSnapshot?: any;
  confidence?: {
    score: number;
    reliability: 'low' | 'medium' | 'high';
  };
}

interface ChatComponentProps {
  selectedSurvey: Survey | null;
  selectedPersonalityId: string | null;
  onSurveyChange: (survey: Survey) => void;
  onPersonalityChange?: (personalityId: string) => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  selectedSurvey,
  selectedPersonalityId,
  onSurveyChange,
  onPersonalityChange
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clickedSuggestion, setClickedSuggestion] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showDataInline, setShowDataInline] = useState<boolean>(false); // false = panel mode, true = inline mode

  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { currentSession, currentMessages, setCurrentMessages, saveMessage, loadSession, createNewSession, isLoadingSession, loadChatSessions, clearCurrentSession } = useChatSessions();

  // Load suggestions when component mounts or survey changes (GET request)
  useEffect(() => {
    if (selectedSurvey?.id) {
      loadSuggestions(selectedSurvey.id);
    }
  }, [selectedSurvey?.id, selectedPersonalityId]);

  // Only reload chat sessions when survey changes - keep current session and messages intact
  useEffect(() => {
    if (!selectedSurvey) {
      // Load all sessions when no survey is selected
      loadChatSessions();
    } else {
      // Load only sessions related to the selected survey
      loadChatSessions(selectedSurvey.id);
    }
  }, [selectedSurvey?.id, loadChatSessions]);

  // Always update messages when currentSession or currentMessages change
  useEffect(() => {

    if (currentSession?.id) {
      
      const mappedMessages = currentMessages.map((msg, index) => {
        
        // Parse data_snapshot if it's a string
        let parsedDataSnapshot = msg.data_snapshot;
        if (typeof msg.data_snapshot === 'string' && msg.data_snapshot) {
          try {
            parsedDataSnapshot = JSON.parse(msg.data_snapshot);
          } catch (e) {
            console.warn(`Failed to parse data_snapshot for message ${index}:`, e);
            parsedDataSnapshot = null;
          }
        }
        
        // Parse confidence if it's a string
        let parsedConfidence = msg.confidence;
        if (typeof msg.confidence === 'string' && msg.confidence) {
          try {
            parsedConfidence = JSON.parse(msg.confidence);
          } catch (e) {
            console.warn(`Failed to parse confidence for message ${index}:`, e);
            parsedConfidence = null;
          }
        }
        
        const mappedMessage = {
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          dataSnapshot: parsedDataSnapshot,
          confidence: typeof parsedConfidence === 'number' 
            ? { score: parsedConfidence, reliability: 'medium' as const }
            : parsedConfidence
        };
        
        return mappedMessage;
      });
      
      setMessages(mappedMessages);
    } else {
      // Clear messages when no session is active
      setMessages([]);
    }
  }, [currentSession?.id, currentMessages]);

  // Clear selected message when switching between chat sessions
  useEffect(() => {
    setSelectedMessage(null);
  }, [currentSession?.id]);

  // Clear selected message when switching to inline mode
  useEffect(() => {
    if (showDataInline) {
      setSelectedMessage(null);
    }
  }, [showDataInline]);

  const loadSuggestions = async (surveyId: string) => {
    try {
      // Use GET request to fetch existing suggestions instead of generating new ones
      const response = await authenticatedFetch(`http://localhost:3000/api/surveys/${surveyId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch survey data');
      }
      
      const surveyData = await response.json();
      
      // If the survey has pre-generated suggestions, use them
      if (surveyData.ai_suggestions && Array.isArray(surveyData.ai_suggestions) && surveyData.ai_suggestions.length > 0) {
        setSuggestions(surveyData.ai_suggestions);
      } else {
        // Fallback to default suggestions
        setSuggestions([t('surveyResults.suggestions.findLookalikeAudiences'), t('surveyResults.suggestions.emotionalTriggers'), t('surveyResults.suggestions.adHook')]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Use default suggestions on error
      setSuggestions([t('surveyResults.suggestions.findLookalikeAudiences'), t('surveyResults.suggestions.emotionalTriggers'), t('surveyResults.suggestions.adHook')]);
    }
  };

  const handleSendMessage = async (content: string, isSuggestion = false) => {
    if (!content.trim() || isSending) return;
    
    if (isSuggestion) {
      setClickedSuggestion(content);
    }
    
    setIsSending(true);
    
    try {
      const sessionId = currentSession?.id;
      const surveyIds = selectedSurvey ? [selectedSurvey.id] : [];

      if (surveyIds.length === 0) {
        throw new Error('Please select a survey first');
      }


      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        sender: "user",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Add typing indicator
      const typingMessage: Message = {
        id: `typing-${Date.now()}`,
        content: t('surveyResults.chat.aiThinking'),
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, typingMessage]);

      // Call backend API for AI analysis with sessionId
      const chatRequestBody: any = {
        question: content,
        surveyIds: surveyIds,
        selectedFileIds: selectedFiles,  // Include selected file IDs
        createSession: true  // Always allow session creation
      };

      console.log('📝 Chat request body:', {
        ...chatRequestBody,
        selectedFileIds: selectedFiles?.length ? selectedFiles : 'No files selected'
      });

      // Only include sessionId if we have a valid one
      if (sessionId) {
        chatRequestBody.sessionId = sessionId;
      }

      // Only include personalityId if it's actually selected
      if (selectedPersonalityId) {
        chatRequestBody.personalityId = selectedPersonalityId;
      }

      const response = await authenticatedFetch('http://localhost:3000/api/surveys/semantic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error calling semantic-chat:', errorData);
        throw new Error(errorData.error || 'Failed to get chat response');
      }

      const data = await response.json();

      // If a new session was created, load it
      if (data.sessionId && data.sessionId !== currentSession?.id) {
        await loadSession(data.sessionId);
      }

      const assistantResponse: Message = {
        id: `assistant-${Date.now()}`,
        content: data.conversationalResponse || 'I apologize, but I encountered an error processing your question.',
        sender: "assistant",
        timestamp: new Date(),
        dataSnapshot: data.dataSnapshot,
        confidence: data.confidence ? {
          score: typeof data.confidence === 'object' ? data.confidence.score : data.confidence,
          reliability: typeof data.confidence === 'object' ? data.confidence.reliability : 
            (data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low')
        } : undefined
      };


      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => !msg.content.includes(t('surveyResults.chat.aiThinking'))).concat([assistantResponse]));

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove typing indicator and show error
      setMessages(prev => prev.filter(msg => !msg.content.includes(t('surveyResults.chat.aiThinking'))).concat([{
        id: `error-${Date.now()}`,
        content: t('surveyResults.chat.errorOccurred'),
        sender: "assistant",
        timestamp: new Date()
      }]));
    } finally {
      setIsSending(false);
      setClickedSuggestion(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-full flex relative">
      {/* Message Details Panel - Right Side - Only show in panel mode */}
      {!showDataInline && (
        <MessageDetailsPanel
          isOpen={selectedMessage !== null}
          onClose={() => setSelectedMessage(null)}
          dataSnapshot={selectedMessage?.dataSnapshot}
          confidence={selectedMessage?.confidence}
          messageContent={selectedMessage?.content || ''}
        />
      )}
      
      {/* Panel Overlay for Mobile - Only in panel mode */}
      {selectedMessage && isMobile && !showDataInline && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSelectedMessage(null)}
        />
      )}
      
      {/* Chat Sidebar - Left Column */}
      <ChatSidebar 
        selectedSurvey={selectedSurvey}
        onSurveyChange={onSurveyChange}
        selectedPersonalityId={selectedPersonalityId}
        onPersonalityChange={onPersonalityChange || (() => {})}
        selectedFiles={selectedFiles}
        onNewChat={async (sessionId) => {
          await loadSession(sessionId);
        }}
        onChatSelect={async (sessionId) => {
          try {
            // Clear file selection when switching to existing session
            setSelectedFiles([]);
            
            const sessionData = await loadSession(sessionId);
    
            if (sessionData?.session) {
              // Update the selected survey if the session has different surveys
              if (sessionData.session.survey_ids?.length > 0 && sessionData.session.survey_ids[0] !== selectedSurvey?.id) {
                // Load survey data to update the selected survey
                try {
                  const surveyRes = await fetch(`http://localhost:3000/api/surveys/${sessionData.session.survey_ids[0]}`);
                  if (surveyRes.ok) {
                    const surveyData = await surveyRes.json();
                    onSurveyChange(surveyData);
                  }
                } catch (error) {
                  console.error('Error loading survey for session:', error);
                }
              }
              
              // If the session has a different personality, switch to it
              if (sessionData.session.personality_id && sessionData.session.personality_id !== selectedPersonalityId) {
                onPersonalityChange?.(sessionData.session.personality_id);
              }
            }
          } catch (error) {
            console.error('Error selecting chat:', error);
          }
        }}
      />
      
      {/* Main Chat Area - Center Column */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        selectedMessage && !isMobile && !showDataInline ? 'mr-96' : ''
      }`}>

        {/* Visualization Toggle - Only show when there's an active survey */}
        {selectedSurvey && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/30">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">{t('surveyResults.dataVisualization.title')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Eye className="h-3 w-3" />
                <span>{t('surveyResults.dataVisualization.panel')}</span>
              </div>
              <Switch
                checked={showDataInline}
                onCheckedChange={setShowDataInline}
                className="data-[state=checked]:bg-blue-600"
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BarChart3 className="h-3 w-3" />
                <span>{t('surveyResults.dataVisualization.inline')}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedSurvey ? (
            <div className="text-center text-gray-400 mt-20">
              <p>{t('surveyResults.chat.selectSurvey')}</p>
            </div>
          ) : isLoadingSession ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('surveyResults.chat.loadingSession')}
                </h3>
                <p className="text-gray-400">
                  {t('surveyResults.chat.loadingSessionDescription')}
                </p>
              </div>
            </div>
          ) : !currentSession ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  No chats yet for this survey
                </h3>
                <p className="text-gray-400 mb-6">
                  Start your first conversation to analyze "{selectedSurvey.title || selectedSurvey.filename || selectedSurvey.id}"
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    // Trigger the new chat modal from the parent
                    const event = new CustomEvent('openNewChatModal');
                    window.dispatchEvent(event);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create First Chat
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('surveyResults.chat.chatAbout', { category: selectedSurvey.category })}
                </h3>
                <p className="text-gray-400 mb-4">
                  {t('surveyResults.chat.description')}
                </p>
              </div>

              {/* Suggestions in center when no messages */}
              {suggestions.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-gray-400 text-xs mb-4 text-center">{t('surveyResults.chat.tryAsking')}:</p>
                  <div className="flex flex-col gap-3">
                    {suggestions.map((question, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className={`bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs md:text-sm py-3 h-auto rounded-lg px-4 shadow-sm text-left justify-start min-h-[48px] w-full whitespace-normal break-words leading-relaxed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isSending && clickedSuggestion === question 
                            ? 'bg-blue-900/50 border-blue-600 text-blue-300 cursor-not-allowed' 
                            : isSending 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        onClick={() => handleSendMessage(question, true)}
                        disabled={isSending}
                      >
                        {isSending && clickedSuggestion === question ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('surveyResults.chat.analyzing')}</span>
                          </div>
                        ) : (
                          question
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show message for existing session with no history */}
              {currentSession?.id && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm">{t('surveyResults.chat.noMessagesYet')}</p>
                  <p className="text-gray-500 text-xs mt-1">{t('surveyResults.chat.startConversation')}</p>
                </div>
              )}

            </div>
          ) : (
            // Regular messages display
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-4 rounded-lg transition-all duration-200 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : `bg-gray-800 text-gray-100 ${
                          (message.dataSnapshot || message.confidence) && !showDataInline
                            ? `cursor-pointer hover:bg-gray-700 hover:shadow-lg border ${
                                selectedMessage?.id === message.id 
                                  ? 'border-blue-500 bg-gray-700/80 shadow-blue-500/20' 
                                  : 'border-gray-700 hover:border-gray-600'
                              }` 
                            : ''
                        }`
                  } ${selectedMessage?.id === message.id && !showDataInline ? 'ring-2 ring-blue-500/30' : ''}`}
                  onClick={() => {
                    // Only allow panel interaction if in panel mode (not inline mode)
                    if (message.sender === 'assistant' && (message.dataSnapshot || message.confidence) && !showDataInline) {
                      setSelectedMessage(selectedMessage?.id === message.id ? null : message);
                    }
                  }}
                >
                  <p className="whitespace-pre-wrap mb-2">{message.content}</p>
                  {/* Inline Data Snapshot - Show when inline mode is enabled */}
                  {showDataInline && message.sender === 'assistant' && (message.dataSnapshot || message.confidence) && (
                    <div className="mt-3 animate-fade-in">
                      <div className="bg-gray-900/80 border border-blue-600 rounded-lg p-4 shadow-lg flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                          <span className="font-semibold text-blue-300 text-sm">{t('surveyResults.chat.aiDataAnalysis')}</span>
                        </div>
                        <InlineDataSnapshot 
                          dataSnapshot={message.dataSnapshot}
                          confidence={message.confidence}
                        />
                      </div>
                    </div>
                  )}
                  {/* Panel Mode Footer - Show when panel mode is enabled and has data */}
                  {!showDataInline && (message.dataSnapshot || message.confidence) && message.sender === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-gray-600 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {message.confidence && (
                          <span className="flex items-center gap-1">
                            📊 {t('surveyResults.chat.confidence')}: {Math.round(message.confidence.score * 100)}%
                          </span>
                        )}
                        {message.dataSnapshot && message.confidence && <span>•</span>}
                        {message.dataSnapshot && (
                          <span>📈 {t('surveyResults.chat.dataAvailable')}</span>
                        )}
                      </div>
                      <span className="text-xs text-blue-400">
                        {selectedMessage?.id === message.id ? t('surveyResults.chat.panelOpen') : t('surveyResults.chat.clickToViewDetails')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Input Area */}
        {selectedSurvey && (
          <div className="border-t border-gray-700 p-6">
            <div className="flex gap-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('surveyResults.chat.inputPlaceholder')}
                disabled={isSending}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};