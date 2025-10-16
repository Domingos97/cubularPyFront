import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  History,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Eraser,
  Target,
  Users,
  HelpCircle,
  ListChecks,
  Lightbulb,
  ArrowRight,
  CheckCheck,
  X,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useNavigate } from 'react-router-dom';

interface GeneratedSurvey {
  success: boolean;
  message: string;
  files: {
    csv: {
      filename: string;
      path: string;
      size: number;
    };
    xlsx: {
      filename: string;
      path: string;
      size: number;
    };
  };
  survey_info: {
    id?: string;
    title: string;
    questions_count: number;
    generated_at: string;
  };
}

interface SurveyBuildingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
}

interface SurveyRequirements {
  objective: boolean;
  targetAudience: boolean;
  questionTypes: boolean;
  questionCount: boolean;
  additionalRequirements: boolean;
}

export const SurveyBuilderPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyBuilderPersonalityId, setSurveyBuilderPersonalityId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyRequirements, setSurveyRequirements] = useState<SurveyRequirements>({
    objective: false,
    targetAudience: false,
    questionTypes: false,
    questionCount: false,
    additionalRequirements: false
  });
  const [showStepGuide, setShowStepGuide] = useState(true);

  const buildingSteps: SurveyBuildingStep[] = useMemo(() => [
    {
      id: 'objective',
      title: 'Survey Objective',
      description: 'What do you want to learn or measure?',
      icon: <Target className="w-5 h-5" />,
      completed: surveyRequirements.objective,
      required: true
    },
    {
      id: 'audience',
      title: 'Target Audience',
      description: 'Who will take this survey?',
      icon: <Users className="w-5 h-5" />,
      completed: surveyRequirements.targetAudience,
      required: true
    },
    {
      id: 'types',
      title: 'Question Types',
      description: 'What types of questions do you need?',
      icon: <HelpCircle className="w-5 h-5" />,
      completed: surveyRequirements.questionTypes,
      required: true
    },
    {
      id: 'count',
      title: 'Question Count',
      description: 'How many questions should there be?',
      icon: <ListChecks className="w-5 h-5" />,
      completed: surveyRequirements.questionCount,
      required: false
    },
    {
      id: 'additional',
      title: 'Additional Details',
      description: 'Any special requirements or preferences?',
      icon: <Lightbulb className="w-5 h-5" />,
      completed: surveyRequirements.additionalRequirements,
      required: false
    }
  ], [surveyRequirements]);

  const {
    currentSession,
    currentMessages,
    setCurrentMessages,
    saveMessage,
    createNewSession,
    loadSession,
    deleteSession,
    updateSessionTitle,
    isLoadingSession,
    chatSessions,
    loadChatSessions
  } = useChatSessions();

  const navigate = useNavigate();

  useEffect(() => {
    loadSurveyBuilderPersonality();
    loadChatSessions(); // Load existing chat sessions
    // Don't auto-initialize session, let user create manually
  }, []);

  useEffect(() => {
    if (currentMessages.length > 0) {
      analyzeConversationProgress();
    }
  }, [currentMessages]);

  const loadSurveyBuilderPersonality = useCallback(async () => {
    try {
      // Get survey builder AI personality
      const personalities = await authenticatedApiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES));
      const surveyBuilderPersonality = personalities.find((p: any) => 
        p.name.toLowerCase().includes('survey builder') || p.name.toLowerCase().includes('survey')
      );
      
      if (surveyBuilderPersonality) {
        setSurveyBuilderPersonalityId(surveyBuilderPersonality.id);
        console.log('Survey builder personality loaded:', surveyBuilderPersonality.name);
      } else {
        console.warn('No survey builder personality found. Survey builder may not work properly.');
        // Don't fail completely - let the backend use default personality
        setSurveyBuilderPersonalityId(null);
      }
    } catch (error) {
      console.error('Error loading survey builder personality:', error);
      // Don't fail completely - let the backend handle default personality
      setSurveyBuilderPersonalityId(null);
    }
  }, []);

  const createNewSurveyBuilderSession = useCallback(async () => {
    try {
      setIsCreatingSession(true);
      console.log('🏗️ Creating new survey builder session...');
      console.log('🏗️ Survey builder personality ID:', surveyBuilderPersonalityId);
      
      // Ensure we have empty surveys array for survey builder
      const result = await createNewSession(
        [], // No surveys needed for survey builder - this is key
        'survey_builder', // This category helps backend identify survey builder sessions
        'New Survey Builder Session' // Title instead of personality ID
      );
      
      console.log('🏗️ Session creation result:', result);
      
      if (result?.success && result?.session?.id) {
        // Load the newly created session
        console.log('🏗️ Loading session:', result.session.id);
        await loadSession(result.session.id);
        // Refresh the sessions list to show the new session
        console.log('🏗️ Refreshing sessions list...');
        await loadChatSessions();
        console.log('🏗️ Survey builder session created successfully:', result.session.id);
        
        // Reset survey requirements for new session
        setSurveyRequirements({
          objective: false,
          targetAudience: false,
          questionTypes: false,
          questionCount: false,
          additionalRequirements: false
        });
        setReadyToGenerate(false);
        setCurrentStep(0);
        
        toast.success('New survey builder session created! Start by describing your survey idea.');
      } else if (result?.id) {
        // Handle different response format
        console.log('🏗️ Loading session (alt format):', result.id);
        await loadSession(result.id);
        await loadChatSessions();
        console.log('🏗️ Survey builder session created successfully:', result.id);
        
        // Reset survey requirements for new session
        setSurveyRequirements({
          objective: false,
          targetAudience: false,
          questionTypes: false,
          questionCount: false,
          additionalRequirements: false
        });
        setReadyToGenerate(false);
        setCurrentStep(0);
        
        toast.success('New survey builder session created! Start by describing your survey idea.');
      } else {
        console.error('🏗️ Session creation returned invalid result:', result);
        throw new Error('Session creation returned invalid result');
      }
    } catch (error) {
      console.error('🏗️ Error creating survey builder session:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to create new session.';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Chat service not available. Please check server connection.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Permission denied. You may not have access to create sessions.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again or contact support.';
        } else if (error.message.length > 0) {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreatingSession(false);
    }
  }, [createNewSession, loadSession, loadChatSessions]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    try {
      console.log('Loading session:', sessionId);
      await loadSession(sessionId);
      console.log('Session loaded successfully:', sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    }
  }, [loadSession]);

  const handleDeleteSession = async (sessionId: string, sessionTitle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection when clicking delete
    
    if (window.confirm(`Are you sure you want to delete "${sessionTitle || 'Untitled Session'}"? This action cannot be undone.`)) {
      try {
        console.log('🗑️ Deleting session:', sessionId);
        await deleteSession(sessionId);
        toast.success('Session deleted successfully');
        
        // Refresh the sessions list
        await loadChatSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
        toast.error('Failed to delete session');
      }
    }
  };

  const handleCopySessionId = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection
    
    try {
      await navigator.clipboard.writeText(sessionId);
      toast.success('Session ID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy session ID:', error);
      toast.error('Failed to copy session ID');
    }
  };

  const handleRenameSession = async (sessionId: string, currentTitle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection
    
    const newTitle = window.prompt('Enter new session title:', currentTitle || 'Untitled Session');
    if (newTitle !== null && newTitle.trim() !== '' && newTitle !== currentTitle) {
      try {
        await updateSessionTitle(sessionId, newTitle.trim());
        toast.success('Session renamed successfully');
        await loadChatSessions();
      } catch (error) {
        console.error('Error renaming session:', error);
        toast.error('Failed to rename session');
      }
    }
  };

  const handleClearMessages = async (sessionId: string, sessionTitle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection
    
    if (window.confirm(`Are you sure you want to clear all messages from "${sessionTitle || 'Untitled Session'}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSION_MESSAGES(sessionId))}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear messages');
        }
        
        toast.success('Messages cleared successfully');
        
        // If this is the current session, refresh it to show empty state
        if (currentSession?.id === sessionId) {
          await loadSession(sessionId);
        }
      } catch (error) {
        console.error('Error clearing messages:', error);
        toast.error('Failed to clear messages');
      }
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    if (!currentSession) {
      toast.error('No active session. Please create a new chat session first.');
      return;
    }

    try {
      setIsLoading(true);
      const isFirstMessage = currentMessages.length === 0;
      
      // Update UI optimistically
      const tempUserInput = userInput; // Store before clearing
      setUserInput('');

      // Make API call to the survey builder chat endpoint
      const chatRequestParams = new URLSearchParams({
        session_id: currentSession.id,
        message: tempUserInput
      });

      console.log('🏗️ Sending survey builder message:', { session_id: currentSession.id, message: tempUserInput });

      const response = await authenticatedApiRequest(`${buildApiUrl(API_CONFIG.ENDPOINTS.SURVEY_BUILDER.CHAT)}?${chatRequestParams.toString()}`, {
        method: 'POST'
      });

      console.log('🏗️ Survey builder API response:', response);

      // The survey builder chat endpoint automatically saves both user and assistant messages
      if (response.response) {
        // Refresh messages from the backend to get the latest state
        console.log('🏗️ Refreshing messages after response...');
        await loadSession(currentSession.id);
        
        // Note: analyzeConversationProgress will be called automatically by useEffect when currentMessages updates
        
        if (isFirstMessage) {
          toast.success('Great! I\'m analyzing your requirements. Let\'s build your survey together!');
        } else {
          toast.success('Message sent successfully!');
        }
      } else {
        throw new Error('No response received from AI');
      }
      
    } catch (error) {
      console.error('🏗️ Error sending message:', error);
      
      // Show specific error message if available
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        // Try to extract backend error details
        if (error.message.includes('Survey Builder not properly configured')) {
          errorMessage = '⚙️ Configuration Error: ' + error.message.split(': ')[1] || 'Survey Builder is not properly configured. Please contact an administrator.';
        } else if (error.message.includes('surveyIds are required')) {
          errorMessage = 'Survey Builder configuration issue: surveyIds validation failed';
        } else if (error.message.includes('personality')) {
          errorMessage = 'Survey Builder AI personality not found. Please contact an administrator.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection error: Could not reach the server. Please try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server configuration error. Please contact an administrator to check the survey builder setup.';
        } else if (error.message.length > 0) {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, currentSession, surveyBuilderPersonalityId, currentMessages.length, loadSession]);

  const analyzeConversationProgress = useCallback(() => {
    const conversation = currentMessages.map(msg => msg.content.toLowerCase()).join(' ');
    
    const newRequirements = { ...surveyRequirements };
    
    // Check for objective/purpose keywords
    const objectiveKeywords = ['purpose', 'goal', 'measure', 'analyze', 'study', 'research', 'understand', 'learn', 'find out', 'discover', 'investigate'];
    newRequirements.objective = objectiveKeywords.some(keyword => conversation.includes(keyword));
    
    // Check for target audience keywords
    const audienceKeywords = ['audience', 'participants', 'respondents', 'users', 'customers', 'employees', 'students', 'people', 'demographic', 'target'];
    newRequirements.targetAudience = audienceKeywords.some(keyword => conversation.includes(keyword));
    
    // Check for question type keywords
    const questionTypeKeywords = ['multiple choice', 'rating', 'scale', 'likert', 'open-ended', 'text', 'dropdown', 'checkbox', 'radio', 'slider', 'matrix'];
    newRequirements.questionTypes = questionTypeKeywords.some(keyword => conversation.includes(keyword));
    
    // Check for question count keywords
    const countKeywords = ['questions', 'how many', 'number of', 'count', 'total'];
    newRequirements.questionCount = countKeywords.some(keyword => conversation.includes(keyword));
    
    // Check for additional requirements
    const additionalKeywords = ['required', 'mandatory', 'optional', 'format', 'style', 'theme', 'branding', 'logic', 'skip', 'conditional'];
    newRequirements.additionalRequirements = additionalKeywords.some(keyword => conversation.includes(keyword));
    
    // Only update state if requirements actually changed
    const hasChanged = JSON.stringify(newRequirements) !== JSON.stringify(surveyRequirements);
    if (hasChanged) {
      setSurveyRequirements(newRequirements);
    }
    
    // Calculate completion percentage
    const requiredCompleted = [newRequirements.objective, newRequirements.targetAudience, newRequirements.questionTypes].filter(Boolean).length;
    const totalRequired = 3;
    const readyForGeneration = requiredCompleted === totalRequired && currentMessages.length >= 6;
    
    if (readyForGeneration !== readyToGenerate) {
      setReadyToGenerate(readyForGeneration);
    }
    
    return newRequirements;
  }, [currentMessages, surveyRequirements, readyToGenerate]);

  const getNextStepSuggestion = useCallback(() => {
    // Use current state instead of calling analyzeConversationProgress to avoid state updates during render
    if (!surveyRequirements.objective) {
      return "Let's start by defining your survey's objective. What do you want to learn or measure with this survey?";
    }
    if (!surveyRequirements.targetAudience) {
      return "Great! Now tell me about your target audience. Who will be taking this survey?";
    }
    if (!surveyRequirements.questionTypes) {
      return "Perfect! What types of questions do you need? (e.g., multiple choice, rating scales, open-ended text, etc.)";
    }
    if (!surveyRequirements.questionCount) {
      return "Excellent progress! How many questions would you like in your survey?";
    }
    if (!surveyRequirements.additionalRequirements) {
      return "Almost ready! Any additional requirements? (e.g., mandatory questions, skip logic, specific formatting, etc.)";
    }
    
    return "You've provided all the necessary information! Click 'Generate Survey' when you're ready to create your survey.";
  }, [surveyRequirements]);

  const checkConversationReadiness = useCallback(async () => {
    if (!currentMessages.length || isAnalyzing) return;
    
    // Use our local analysis instead of API call for immediate feedback
    analyzeConversationProgress();
  }, [currentMessages, isAnalyzing, analyzeConversationProgress]);

  const generateSurvey = useCallback(async () => {
    if (!readyToGenerate || !currentMessages.length) {
      toast.error('Please complete the conversation before generating the survey');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare comprehensive survey data based on conversation
      const conversation = currentMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Extract structured requirements from conversation
      const surveyData = {
        conversation,
        survey_title: surveyTitle || 'AI Generated Survey',
        requirements: surveyRequirements,
        analysis: {
          objective_identified: surveyRequirements.objective,
          audience_defined: surveyRequirements.targetAudience,
          question_types_specified: surveyRequirements.questionTypes,
          question_count_provided: surveyRequirements.questionCount,
          additional_requirements: surveyRequirements.additionalRequirements
        }
      };

      console.log('🏗️ Generating survey with structured data:', surveyData);

      const response = await authenticatedApiRequest<GeneratedSurvey>('/api/v1/survey-builder/generate-survey', {
        method: 'POST',
        body: JSON.stringify(surveyData)
      });

      if (response.success) {
        toast.success(`🎉 Survey generated successfully! ${response.survey_info.questions_count} questions created.`);
        toast.success(`📄 Files: ${response.files.csv.filename}, ${response.files.xlsx.filename}`);
        setReadyToGenerate(false);
        setSurveyRequirements({
          objective: false,
          targetAudience: false,
          questionTypes: false,
          questionCount: false,
          additionalRequirements: false
        });
        const successMessage = `✅ Survey "${response.survey_info.title}" has been generated with ${response.survey_info.questions_count} questions! You can download the files from the admin panel.`;
        if (currentSession?.id) {
          await loadSession(currentSession.id);
        }
        // Redirect to survey view page
        if (response.survey_info.id) {
          navigate(`/admin/survey/${response.survey_info.id}`);
        } else {
          // Navigate to the surveys tab to see the generated survey
          navigate('/admin?tab=surveys');
        }
      }
    } catch (error) {
      console.error('🏗️ Error generating survey:', error);
      toast.error('Failed to generate survey. Please try again or provide more details.');
    } finally {
      setIsGenerating(false);
    }
  }, [readyToGenerate, currentMessages, surveyTitle, surveyRequirements, currentSession?.id, loadSession, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Survey Builder</h2>
          <p className="text-gray-400">Create surveys through AI-powered conversation</p>
          {currentSession && (
            <p className="text-sm text-green-400 mt-1">
              Active Session: {currentSession.id.slice(0, 8)}...
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {readyToGenerate && (
            <Button
              onClick={generateSurvey}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Generating Survey...' : 'Generate Survey'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        
        {/* Left Side - Chat History Panel */}
        <Card className="bg-gray-800/80 border-gray-700 flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-700">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Chat History
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
            {/* New Chat Button */}
            <Button
              onClick={createNewSurveyBuilderSession}
              disabled={isCreatingSession}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingSession ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isCreatingSession ? 'Creating...' : 'New Chat'}
            </Button>
            
            {/* Session Count */}
            <div className="text-sm text-gray-400 text-center">
              {chatSessions.filter(session => session.category === 'survey_builder').length} session(s)
            </div>
            
            {/* Sessions List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {chatSessions
                  .filter(session => session.category === 'survey_builder')
                  .map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors relative group ${
                        currentSession?.id === session.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleSessionSelect(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">
                            {session.title || 'Untitled Session'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.id.slice(0, 8)}...
                          </p>
                          {currentSession?.id === session.id && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </div>
                          )}
                        </div>
                        
                        {/* Context Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => handleRenameSession(session.id, session.title, e)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleCopySessionId(session.id, e)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Session ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleClearMessages(session.id, session.title, e)}
                              className="cursor-pointer text-yellow-600 focus:text-yellow-600 focus:bg-yellow-100 dark:focus:bg-yellow-900/20"
                            >
                              <Eraser className="mr-2 h-4 w-4" />
                              Clear Messages
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteSession(session.id, session.title, e)}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Session
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                {chatSessions.filter(session => session.category === 'survey_builder').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sessions yet</p>
                    <p className="text-xs text-gray-500">Create your first chat</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Side - Main Chat Interface */}
        <Card className="bg-gray-800/80 border-gray-700 lg:col-span-3 flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-700">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Survey Builder Chat
              </div>
              <div className="flex items-center space-x-2">
                {isAnalyzing ? (
                  <div className="flex items-center text-yellow-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                ) : readyToGenerate ? (
                  <div className="flex items-center text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Ready to generate!</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Continue conversation...</span>
                  </div>
                )}
              </div>
            </CardTitle>
            
            {/* Survey Building Progress */}
            {showStepGuide && currentSession && (
              <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Survey Building Progress</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStepGuide(false)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
                  {buildingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.completed 
                          ? 'bg-green-600 text-white' 
                          : step.required 
                            ? 'bg-yellow-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                      }`}>
                        {step.completed ? <CheckCheck className="w-4 h-4" /> : step.icon}
                      </div>
                      <div className="flex-1 min-w-0 hidden md:block">
                        <p className={`text-xs font-medium truncate ${
                          step.completed ? 'text-green-400' : step.required ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                      {index < buildingSteps.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-gray-500 hidden md:block" />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Required Steps Completed</span>
                    <span>{buildingSteps.filter(s => s.required && s.completed).length}/{buildingSteps.filter(s => s.required).length}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(buildingSteps.filter(s => s.required && s.completed).length / buildingSteps.filter(s => s.required).length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Next Step Suggestion */}
                <div className="p-3 bg-blue-900/30 rounded border border-blue-600/30">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-300">{getNextStepSuggestion()}</p>
                  </div>
                </div>
              </div>
            )}
            
            {readyToGenerate && (
              <div className="mt-2">
                <Input
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  placeholder="Enter survey title (optional)"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Welcome Message - Only show when no messages exist */}
                {!currentSession ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Welcome to AI Survey Builder</h3>
                    <p className="text-gray-400 mb-4">
                      Create professional surveys through natural conversation with our AI assistant.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Click "New Chat" to start building your survey.
                    </p>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="space-y-6">
                    {/* Instructions Card */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">🚀 Let's Build Your Survey!</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            Simply describe what you want to measure and who your audience is. 
                            I'll guide you through creating the perfect survey with the right question types and structure.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* What We'll Cover */}
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        We'll cover these key areas together:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <Target className="w-3 h-3 text-yellow-400" />
                          <span><strong>Survey Purpose:</strong> What you want to learn</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span><strong>Target Audience:</strong> Who will participate</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <HelpCircle className="w-3 h-3 text-green-400" />
                          <span><strong>Question Types:</strong> Multiple choice, ratings, etc.</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ListChecks className="w-3 h-3 text-purple-400" />
                          <span><strong>Question Count:</strong> How many questions</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Start Suggestions */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Quick Start Options</h4>
                        <p className="text-xs text-gray-500">Click any option below to get started, or type your own description</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          {
                            title: "Customer Satisfaction",
                            description: "I want to create a customer satisfaction survey for my e-commerce business with rating scales and feedback questions.",
                            icon: <Users className="w-4 h-4 text-blue-400" />,
                            color: "border-blue-500 hover:bg-blue-900/20"
                          },
                          {
                            title: "Employee Engagement", 
                            description: "I need an employee engagement survey for a tech company with about 50 employees using multiple choice and rating questions.",
                            icon: <Target className="w-4 h-4 text-green-400" />,
                            color: "border-green-500 hover:bg-green-900/20"
                          },
                          {
                            title: "Product Feedback",
                            description: "I want to gather feedback on a new mobile app from beta users with 10-15 questions including ratings and open-ended responses.",
                            icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
                            color: "border-purple-500 hover:bg-purple-900/20"
                          },
                          {
                            title: "Custom Survey",
                            description: "I have a specific survey topic in mind and want to discuss the requirements step by step.",
                            icon: <Lightbulb className="w-4 h-4 text-orange-400" />,
                            color: "border-orange-500 hover:bg-orange-900/20"
                          }
                        ].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className={`h-auto p-4 text-left justify-start ${suggestion.color} transition-all duration-200 hover:scale-[1.02]`}
                            onClick={() => setUserInput(suggestion.description)}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className="flex-shrink-0 mt-1">
                                {suggestion.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-white mb-1">{suggestion.title}</h5>
                                <p className="text-xs text-gray-400 leading-relaxed">{suggestion.description}</p>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          Start typing below to describe your survey needs in your own words
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {/* Chat Messages */}
                {currentMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-br from-purple-600 to-blue-600'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`rounded-lg p-4 shadow-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}>
                        {/* Sender Label */}
                        <div className={`text-xs font-medium mb-2 ${
                          message.sender === 'user' 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.sender === 'user' ? 'You' : 'AI Assistant'}
                        </div>
                        
                        {/* Message Content */}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* Timestamp */}
                        <div className={`text-xs mt-2 ${
                          message.sender === 'user' 
                            ? 'text-blue-200' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {(isLoading || isLoadingSession) && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start space-x-3 max-w-[85%]">
                      {/* AI Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      
                      {/* Typing Bubble */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          AI Assistant
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Thinking</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Generate Survey Button */}
            {readyToGenerate && currentSession && (
              <div className="border-t border-gray-700 p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Ready to Generate Survey!</h3>
                      <p className="text-xs text-gray-400">All required information collected</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={generateSurvey}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-6"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Generate Survey
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Survey Requirements Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Objective', completed: surveyRequirements.objective, icon: <Target className="w-3 h-3" /> },
                    { label: 'Audience', completed: surveyRequirements.targetAudience, icon: <Users className="w-3 h-3" /> },
                    { label: 'Question Types', completed: surveyRequirements.questionTypes, icon: <HelpCircle className="w-3 h-3" /> },
                    { label: 'Question Count', completed: surveyRequirements.questionCount, icon: <ListChecks className="w-3 h-3" /> },
                    { label: 'Requirements', completed: surveyRequirements.additionalRequirements, icon: <Lightbulb className="w-3 h-3" /> }
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
                      item.completed ? 'bg-green-900/30 text-green-400' : 'bg-gray-800/50 text-gray-500'
                    }`}>
                      {item.icon}
                      <span>{item.label}</span>
                      {item.completed && <CheckCheck className="w-3 h-3" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Input Area */}
            {currentSession && (
              <div className="border-t border-gray-700 bg-gray-900/50 p-4">
                {/* Progress Hint */}
                {!readyToGenerate && currentMessages.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-300">
                        <strong>Next step:</strong> {getNextStepSuggestion()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Input Row */}
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={
                        currentMessages.length === 0 
                          ? "Tell me about your survey idea..." 
                          : "Continue the conversation..."
                      }
                      className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isLoading || isLoadingSession}
                    />
                    
                    {/* Character count */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {userInput.length}/500
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || isLoadingSession || !userInput.trim()}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200"
                  >
                    {isLoading || isLoadingSession ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* Helper Text */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>💡 Be specific about your survey goals</span>
                    <span>👥 Mention your target audience</span>
                    <span>📊 Include preferred question types</span>
                  </div>
                  <div className="text-gray-400">
                    Press Enter to send
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Chat History Panel removed since it's now on the left */}
      </div>
    </div>
  );
};

export default SurveyBuilderPanel;