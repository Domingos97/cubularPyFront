import React from 'react';
import { X, BarChart3, TrendingUp, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserFriendlySnapshot {
  summary: {
    searchTerm: string;
  };
  insights: Array<{
    title: string;
    value: string;
    icon: string;
  }>;
  confidence?: {
    level: 'High' | 'Medium' | 'Low';
    explanation: string;
  };
}

interface MessageDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dataSnapshot?: UserFriendlySnapshot | any; // Support both old and new format
  confidence?: {
    score: number;
    reliability: 'low' | 'medium' | 'high';
  };
  messageContent: string;
}

export const MessageDetailsPanel: React.FC<MessageDetailsPanelProps> = ({
  isOpen,
  onClose,
  dataSnapshot,
  confidence,
  messageContent
}) => {
  // Handle escape key to close panel
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);
  const getIconForField = (key: string): string => {
    const lowercaseKey = key.toLowerCase();
    if (lowercaseKey.includes('age') || lowercaseKey.includes('demographic')) return '👥';
    if (lowercaseKey.includes('product') || lowercaseKey.includes('brand') || lowercaseKey.includes('category')) return '🛍️';
    if (lowercaseKey.includes('engagement') || lowercaseKey.includes('activity') || lowercaseKey.includes('interaction')) return '📈';
    if (lowercaseKey.includes('satisfaction') || lowercaseKey.includes('rating') || lowercaseKey.includes('score')) return '⭐';
    if (lowercaseKey.includes('behavior') || lowercaseKey.includes('pattern') || lowercaseKey.includes('trend')) return '🧠';
    if (lowercaseKey.includes('target') || lowercaseKey.includes('recommendation') || lowercaseKey.includes('advice')) return '🎯';
    if (lowercaseKey.includes('location') || lowercaseKey.includes('geographic') || lowercaseKey.includes('region')) return '📍';
    if (lowercaseKey.includes('income') || lowercaseKey.includes('financial') || lowercaseKey.includes('economic')) return '💰';
    if (lowercaseKey.includes('preference') || lowercaseKey.includes('choice') || lowercaseKey.includes('selection')) return '❤️';
    if (lowercaseKey.includes('distribution') || lowercaseKey.includes('breakdown') || lowercaseKey.includes('analysis')) return '📊';
    return '📋';
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // State for managing expanded text items
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderDataValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    if (typeof value === 'object') {
      // Handle arrays of insights or findings
      if (Array.isArray(value)) {
        return (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="bg-gray-900/50 rounded p-2 border-l-2 border-blue-400/30">
                <span className="text-xs text-gray-100 leading-relaxed">{String(item)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      // Handle objects with key-value pairs
      return (
        <div className="space-y-2">
          {Object.entries(value).map(([subKey, val]) => (
            <div key={subKey} className="space-y-1">
              <div className="text-xs font-medium text-blue-300 capitalize">
                {subKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className="bg-gray-900/50 rounded p-2 ml-2 border-l-2 border-gray-600">
                <span className="text-xs text-gray-100 leading-relaxed">{String(val)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'string' && value.length > 200) {
      // For long strings, make them expandable using the key
      const isExpanded = expandedItems.has(key);
      
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-100 leading-relaxed">
            {isExpanded ? value : `${value.substring(0, 200)}...`}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpanded(key)}
            className="text-blue-400 hover:text-blue-300 h-6 px-2 text-xs"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      );
    }
    
    // For regular strings and numbers
    return <span className="text-xs text-gray-100 leading-relaxed">{String(value)}</span>;
  };

  const getConfidenceColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-400 bg-green-400/20 border-green-400';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400';
      case 'low': return 'text-red-400 bg-red-400/20 border-red-400';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400';
    }
  };

  const getConfidenceIcon = (reliability: string) => {
    switch (reliability) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  // Check if this is the new UserFriendlySnapshot format
  const isNewFormat = dataSnapshot && dataSnapshot.summary && dataSnapshot.insights;
  
  const hasData = dataSnapshot && (
    isNewFormat || 
    (typeof dataSnapshot === 'object' && Object.keys(dataSnapshot).length > 0)
  );

  // Enhanced filtering - show MORE data to users
  const getFilteredEntries = () => {
    if (!hasData) return [];
    
    // Handle new format
    if (isNewFormat) {
      // Convert new format to key-value pairs for display
      const snapshot = dataSnapshot as UserFriendlySnapshot;
      const entries: [string, any][] = [];
      
      // Add summary info
      entries.push(['Search Term', snapshot.summary.searchTerm]);
      
      // Add insights
      if (snapshot.insights && snapshot.insights.length > 0) {
        snapshot.insights.forEach((insight, index) => {
          entries.push([insight.title, insight.value]);
        });
      }
      
      // Add confidence info (only if confidence exists)
      if (snapshot.confidence) {
        entries.push(['Confidence Level', snapshot.confidence.level || 'Unknown']);
        entries.push(['Confidence Explanation', snapshot.confidence.explanation || 'Not available']);
      }
      
      return entries;
    }
    
    // Handle old format
    return Object.entries(dataSnapshot).filter(([key, value]) => {
      // Only filter out completely empty values
      if (value === null || value === undefined || value === '') return false;
      
      // Keep "Not available" and "N/A" as informational content
      // Only filter out technical system fields
      const lowercaseKey = key.toLowerCase().replace(/[^a-z]/g, '');
      const isSystemField = lowercaseKey.includes('surveyid') || 
                           lowercaseKey.includes('analysisid') || 
                           lowercaseKey.includes('sessionid') ||
                           lowercaseKey.includes('analysistype');
      
      return !isSystemField; // Show everything except system fields
    });
  };

  const filteredEntries = getFilteredEntries();
  const hasFilteredData = filteredEntries.length > 0;
  const hasConfidence = confidence && confidence.score !== undefined;

  // Debug logging to verify data_snapshot mapping
  React.useEffect(() => {
    if (isOpen) {
      console.log('MessageDetailsPanel - dataSnapshot:', dataSnapshot);
      console.log('MessageDetailsPanel - dataSnapshot type:', typeof dataSnapshot);
      console.log('MessageDetailsPanel - isNewFormat:', isNewFormat);
      console.log('MessageDetailsPanel - hasData:', hasData);
      console.log('MessageDetailsPanel - confidence:', confidence);
    }
  }, [isOpen, dataSnapshot, hasData, confidence, isNewFormat]);

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-96 bg-gray-900/98 border-l border-gray-700 backdrop-blur-sm z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h2 className="text-white text-lg font-semibold">Data Analysis</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content with improved scrolling */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Confidence Section */}
            {hasConfidence && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Confidence</h3>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Score</span>
                    <Badge 
                      variant="outline" 
                      className={`${getConfidenceColor(confidence.reliability)} border text-xs`}
                    >
                      <div className="flex items-center gap-1">
                        {getConfidenceIcon(confidence.reliability)}
                        {confidence.reliability.toUpperCase()}
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{confidence.score}%</span>
                      <span className="text-gray-400">{confidence.reliability}</span>
                    </div>
                    <Progress 
                      value={confidence.score} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Snapshot Section - Enhanced to show ALL data */}
            {hasFilteredData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Data Snapshots</h3>
                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                    {filteredEntries.length} of {Object.keys(dataSnapshot).length} insights
                  </Badge>
                  {Object.keys(dataSnapshot).length > filteredEntries.length && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                      {Object.keys(dataSnapshot).length - filteredEntries.length} system fields
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  {filteredEntries.map(([key, value]) => {
                    // All entries here are already filtered, so display them all
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                    
                    return (
                      <div key={key} className="bg-gray-800/30 rounded-lg p-3 space-y-3 border border-gray-700/30">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                          <span className="text-sm">{getIconForField(key)}</span>
                          <h4 className="text-xs font-medium text-blue-300 uppercase tracking-wide flex-1">
                            {formattedKey}
                          </h4>
                          {/* Show data type indicators */}
                          {value === 'Not available' || value === 'N/A' ? (
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                              Info
                            </Badge>
                          ) : typeof value === 'string' && value.length > 100 ? (
                            <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                              Detailed
                            </Badge>
                          ) : Array.isArray(value) ? (
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                              {value.length} items
                            </Badge>
                          ) : null}
                        </div>
                        <div>
                          {renderDataValue(value, key)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data snapshots available</p>
                <p className="text-xs text-gray-600 mt-1">
                  {dataSnapshot && typeof dataSnapshot === 'object' && Object.keys(dataSnapshot).length > 0
                    ? 'Data snapshots contain only empty or invalid values'
                    : 'This message doesn\'t contain survey data analysis'
                  }
                </p>
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <p>• Try asking questions about survey data</p>
                  <p>• Data snapshots contain survey insights and statistics</p>
                  {dataSnapshot && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                        Debug info
                      </summary>
                      <pre className="mt-2 font-mono text-xs bg-gray-800 p-2 rounded text-left overflow-auto max-h-32">
                        {JSON.stringify(dataSnapshot, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};