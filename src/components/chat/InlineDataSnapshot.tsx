import React, { useState } from 'react';
import { BarChart3, Copy, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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

interface InlineDataSnapshotProps {
  dataSnapshot?: UserFriendlySnapshot | any; // Support both old and new format
  confidence?: {
    score: number;
    reliability: 'low' | 'medium' | 'high';
  };
}

export const InlineDataSnapshot: React.FC<InlineDataSnapshotProps> = ({
  dataSnapshot,
  confidence
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const getInsightTooltip = (title: string, icon: string): string => {
    if (title.toLowerCase().includes('demographic') || title.toLowerCase().includes('distribution')) {
      return "Breakdown of survey respondent characteristics and segments";
    }
    if (title.toLowerCase().includes('sentiment') || icon.includes('😊') || icon.includes('😞')) {
      return "Analysis of positive and negative sentiment in responses";
    }
    if (title.toLowerCase().includes('theme') || title.toLowerCase().includes('category')) {
      return "Most common topics and categories mentioned in responses";
    }
    if (title.toLowerCase().includes('personality') || icon.includes('🧠')) {
      return "Psychological profile analysis based on response patterns";
    }
    if (title.toLowerCase().includes('response') || title.toLowerCase().includes('depth')) {
      return "Quality and depth analysis of survey responses";
    }
    if (title.toLowerCase().includes('sample') || icon.includes('📈') || icon.includes('📊')) {
      return "Statistical confidence based on response volume and quality";
    }
    return "Additional insight derived from survey data analysis";
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getConfidenceColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-400 bg-green-400/20 border-green-400';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400';
      case 'low': return 'text-red-400 bg-red-400/20 border-red-400';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400';
    }
  };

  const toggleItemExpansion = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const renderDataValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined || value === '' || value === 'Not available' || value === 'N/A') {
      return <span className="text-gray-500 italic text-sm">No data available</span>;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        const isItemExpanded = expandedItems.has(key);
        const displayItems = isItemExpanded ? value : value.slice(0, 3);
        
        return (
          <div className="space-y-1">
            {displayItems.map((item, index) => (
              <div key={index} className="text-sm text-gray-200 bg-gray-800/40 rounded-lg px-3 py-2">
                {String(item)}
              </div>
            ))}
            {value.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleItemExpansion(key)}
                className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
              >
                {isItemExpanded ? (
                  <><ChevronUp className="h-3 w-3 mr-1" />Show Less</>
                ) : (
                  <><ChevronDown className="h-3 w-3 mr-1" />Show {value.length - 3} More</>
                )}
              </Button>
            )}
          </div>
        );
      }
      
      return (
        <div className="space-y-1">
          {Object.entries(value).slice(0, 3).map(([subKey, val]) => (
            <div key={subKey} className="text-sm bg-gray-800/30 rounded px-3 py-2">
              <span className="text-blue-300 font-medium">{subKey}:</span>
              <span className="text-gray-200 ml-2">{String(val)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    const stringValue = String(value);
    if (stringValue.length > 200) {
      const isItemExpanded = expandedItems.has(key);
      const displayText = isItemExpanded ? stringValue : `${stringValue.substring(0, 200)}...`;
      
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {displayText}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleItemExpansion(key)}
            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
          >
            {isItemExpanded ? (
              <><ChevronUp className="h-3 w-3 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" />Read More</>
            )}
          </Button>
        </div>
      );
    }
    
    return (
      <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
        {stringValue}
      </div>
    );
  };

  const handleCopyData = () => {
    if (!dataSnapshot) return;
    
    // Check if this is the new format
    const isNewFormat = dataSnapshot && dataSnapshot.summary && dataSnapshot.insights;
    
    if (isNewFormat) {
      const newSnapshot = dataSnapshot as UserFriendlySnapshot;
      const confidenceText = newSnapshot.confidence ? `Confidence: ${newSnapshot.confidence.level}` : 'Confidence: Not available';
      const dataText = `Data Insights: ${newSnapshot.summary.searchTerm}
${confidenceText}

Key Data Points:
${newSnapshot.insights.map((insight, i) => 
  `${insight.icon} ${insight.title} ${insight.value}`
).join('\n')}`;
      
      navigator.clipboard.writeText(dataText);
    } else {
      // Old format
      const dataText = Object.entries(dataSnapshot)
        .map(([key, value]) => `${formatFieldLabel(key)}: ${value}`)
        .join('\n\n');
      
      navigator.clipboard.writeText(dataText);
    }
    
    toast({
      title: "Data copied",
      description: "Survey insights copied to clipboard",
    });
  };

  const hasData = dataSnapshot && Object.keys(dataSnapshot).length > 0;
  const hasConfidence = confidence && confidence.score !== undefined;

  if (!hasData && !hasConfidence) return null;

  // Check if this is the new UserFriendlySnapshot format
  const isNewFormat = dataSnapshot && dataSnapshot.summary && dataSnapshot.insights;
  
  if (isNewFormat) {
    const newSnapshot = dataSnapshot as UserFriendlySnapshot;
    
    return (
      <div className="mt-3">
        {/* Key Insights - Green Box Format Only */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 border border-green-600/50 rounded-xl p-4">
          {/* Structured Insights */}
          <div className="space-y-3">
            {(isExpanded ? newSnapshot.insights : newSnapshot.insights.slice(0, 5)).map((insight, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-green-300">
                    {insight.title.replace(':', '')}:
                  </span>
                  <span className="text-sm text-green-100 ml-2">
                    {insight.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Expand/Collapse */}
          {newSnapshot.insights.length > 5 && (
            <div className="pt-3 border-t border-green-600/30 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full h-8 text-xs text-green-400 hover:text-green-300 hover:bg-green-800/20"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show All ({newSnapshot.insights.length} insights)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Focus on essential data snapshots - filter out only technical IDs
  const filteredDataSnapshot = hasData ? Object.entries(dataSnapshot).filter(([key, value]) => {
    // Filter out null, undefined, empty strings
    if (value === null || value === undefined || value === '' || value === 'Not available' || value === 'N/A') {
      return false;
    }
    
    // Only filter out technical system fields
    const lowercaseKey = key.toLowerCase().replace(/[^a-z]/g, '');
    return !lowercaseKey.includes('surveyid') && 
           !lowercaseKey.includes('analysisid') && 
           !lowercaseKey.includes('sessionid');
  }) : [];

  // Simple display logic - show 3 items by default, expand to show all
  const displayItems = isExpanded ? filteredDataSnapshot : filteredDataSnapshot.slice(0, 3);
  const hasMoreItems = filteredDataSnapshot.length > 3;

  return (
    <div className="mt-3">
      {/* Key Insights - Green Box Format */}
      <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 border border-green-600/50 rounded-xl p-4">
        <div className="space-y-3">
          {displayItems.map(([key, value]) => (
            <div key={key} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-green-300">
                  {formatFieldLabel(key)}:
                </span>
                <span className="text-sm text-green-100 ml-2">
                  {renderDataValue(value, key)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Expand/Collapse */}
        {hasMoreItems && (
          <div className="pt-3 border-t border-green-600/30 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-8 text-xs text-green-400 hover:text-green-300 hover:bg-green-800/20"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {filteredDataSnapshot.length - 3} More
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};