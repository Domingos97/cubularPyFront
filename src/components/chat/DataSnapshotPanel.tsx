import { Copy, BarChart3, ChevronDown, ChevronUp, Search, TrendingUp, Users, Target, Star, Brain, Package, MapPin, DollarSign, Heart, Tag, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

interface DataSnapshotProps {
  dataSnapshot: Record<string, any>;
}

export const DataSnapshotPanel = ({ dataSnapshot }: DataSnapshotProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleCopyData = () => {
    const dataText = Object.entries(dataSnapshot)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(dataText);
    toast({
      title: "Data copied",
      description: "Survey insights copied to clipboard",
    });
  };

  const getIconForField = (key: string): React.ReactNode => {
    const lowercaseKey = key.toLowerCase();
    
    // Demographics & User Info
    if (lowercaseKey.includes('age') || lowercaseKey.includes('demographic') || lowercaseKey.includes('profile')) 
      return <Users className="h-4 w-4 text-purple-400" />;
    
    // Products & Brands
    if (lowercaseKey.includes('product') || lowercaseKey.includes('brand') || lowercaseKey.includes('category')) 
      return <Package className="h-4 w-4 text-blue-400" />;
    
    // Engagement & Activity
    if (lowercaseKey.includes('engagement') || lowercaseKey.includes('activity') || lowercaseKey.includes('interaction') || lowercaseKey.includes('metric')) 
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    
    // Satisfaction & Ratings
    if (lowercaseKey.includes('satisfaction') || lowercaseKey.includes('rating') || lowercaseKey.includes('score')) 
      return <Star className="h-4 w-4 text-yellow-400" />;
    
    // Behavior & Patterns
    if (lowercaseKey.includes('behavior') || lowercaseKey.includes('pattern') || lowercaseKey.includes('trend')) 
      return <Brain className="h-4 w-4 text-indigo-400" />;
    
    // Targeting & Recommendations
    if (lowercaseKey.includes('target') || lowercaseKey.includes('recommendation') || lowercaseKey.includes('advice')) 
      return <Target className="h-4 w-4 text-red-400" />;
    
    // Location & Geography
    if (lowercaseKey.includes('location') || lowercaseKey.includes('geographic') || lowercaseKey.includes('region')) 
      return <MapPin className="h-4 w-4 text-cyan-400" />;
    
    // Financial & Economic
    if (lowercaseKey.includes('income') || lowercaseKey.includes('financial') || lowercaseKey.includes('economic') || lowercaseKey.includes('price')) 
      return <DollarSign className="h-4 w-4 text-emerald-400" />;
    
    // Preferences & Choices
    if (lowercaseKey.includes('preference') || lowercaseKey.includes('choice') || lowercaseKey.includes('selection')) 
      return <Heart className="h-4 w-4 text-pink-400" />;
    
    // Themes & Keywords
    if (lowercaseKey.includes('theme') || lowercaseKey.includes('keyword') || lowercaseKey.includes('tag')) 
      return <Tag className="h-4 w-4 text-orange-400" />;
    
    // Search & Responses
    if (lowercaseKey.includes('response') || lowercaseKey.includes('match') || lowercaseKey.includes('search')) 
      return <Search className="h-4 w-4 text-teal-400" />;
    
    // Default
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
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
    // Handle completely empty values
    if (value === null || value === undefined || value === '') {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic text-sm">
          <Info className="h-3 w-3" />
          <span>No data provided</span>
        </div>
      );
    }

    // Handle "Not available" and "N/A" as informational content
    if (value === 'Not available' || value === 'N/A') {
      return (
        <div className="flex items-center gap-2 text-amber-500 text-sm">
          <Info className="h-3 w-3" />
          <span className="italic">{value}</span>
        </div>
      );
    }

    // Handle arrays - show ALL items by default, with expansion for very long arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        const isExpanded = expandedItems.has(key);
        const showLimit = 8; // Show more items by default
        const displayItems = isExpanded ? value : value.slice(0, showLimit);
        
        return (
          <div className="space-y-2">
            <div className="grid gap-2">
              {displayItems.map((item, index) => {
                // Handle stats array with category/items structure
                if (typeof item === 'object' && item !== null && item.category) {
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-900/40 to-blue-800/30 rounded-lg p-3 border border-blue-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{item.icon || '📊'}</span>
                        <span className="text-blue-300 font-semibold">{item.category}</span>
                      </div>
                      {item.items && Array.isArray(item.items) && (
                        <div className="space-y-1 ml-6">
                          {item.items.map((subItem: any, subIndex: number) => (
                            <div key={subIndex} className="flex items-center justify-between text-sm">
                              <span className="text-gray-200">{subItem.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 font-medium">{subItem.percentage}%</span>
                                <span className="text-gray-400">({subItem.count})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={index} className="text-sm text-gray-100 bg-gradient-to-r from-gray-800/40 to-gray-700/30 rounded-lg px-3 py-2 border-l-2 border-blue-400/40">
                    <span className="font-medium">{typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}</span>
                  </div>
                );
              })}
            </div>
            {value.length > showLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleItemExpansion(key)}
                className="h-7 px-3 text-xs text-blue-400 hover:text-blue-300 border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/10 transition-all"
              >
                {isExpanded ? (
                  <><ChevronUp className="h-3 w-3 mr-1" />Show Less ({value.length - showLimit} items hidden)</>
                ) : (
                  <><ChevronDown className="h-3 w-3 mr-1" />Show All {value.length} Items ({value.length - showLimit} more)</>
                )}
              </Button>
            )}
          </div>
        );
      }
      
      // Handle objects - show ALL properties
      return (
        <div className="space-y-2">
          <div className="grid gap-2">
            {Object.entries(value).map(([subKey, val]) => (
              <div key={subKey} className="text-sm bg-gradient-to-r from-gray-800/30 to-gray-700/20 rounded-lg px-3 py-2 border border-gray-700/30">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-blue-300 font-semibold text-xs uppercase tracking-wide">{subKey}:</span>
                  <span className="text-gray-100 font-medium">{typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val || 'No data')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Handle long text with better expansion (reduced from 400 to 250 chars)
    const stringValue = String(value);
    if (stringValue.length > 250) {
      const isExpanded = expandedItems.has(key);
      const displayText = isExpanded ? stringValue : `${stringValue.substring(0, 250)}...`;
      
      return (
        <div className="space-y-3">
          <div className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            {displayText}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleItemExpansion(key)}
            className="h-7 px-3 text-xs text-blue-400 hover:text-blue-300 border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/10 transition-all"
          >
            {isExpanded ? (
              <><ChevronUp className="h-3 w-3 mr-1" />Show Less</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" />Read Full Content ({stringValue.length - 250} more characters)</>
            )}
          </Button>
        </div>
      );
    }

    // Handle regular text
    return (
      <div className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap font-medium">
        {stringValue}
      </div>
    );
  };

  // Enhanced filtering - show ALL meaningful data to users
  const filteredData = useMemo(() => {
    const entries = Object.entries(dataSnapshot).filter(([key, value]) => {
      // Only filter out completely empty values (null, undefined, empty string)
      if (value === null || value === undefined || value === '') return false;
      
      // Keep "Not available" and "N/A" as they provide information
      // Only filter out technical system fields
      const lowercaseKey = key.toLowerCase().replace(/[^a-z]/g, '');
      const isSystemField = lowercaseKey.includes('surveyid') || 
                           lowercaseKey.includes('analysisid') || 
                           lowercaseKey.includes('sessionid') ||
                           lowercaseKey.includes('requestid') ||
                           lowercaseKey.includes('timestamp') ||
                           lowercaseKey.includes('analysistype');
      
      if (isSystemField) return false;
      
      // Apply search filter if present
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const keyMatch = key.toLowerCase().includes(searchLower);
        const valueMatch = value.toString().toLowerCase().includes(searchLower);
        return keyMatch || valueMatch;
      }
      
      return true; // Show everything else
    });

    // Sort by key name for consistent ordering
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [dataSnapshot, searchTerm]);

  const isEmpty = Object.keys(dataSnapshot).length === 0;
  const hasResults = filteredData.length > 0;
  const totalFields = Object.keys(dataSnapshot).length;
  const hiddenFields = totalFields - filteredData.length;

  return (
    <TooltipProvider>
      <Card className="h-full bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl flex flex-col">
        {/* Enhanced Header */}
        <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-gray-100 text-base">Survey Insights Panel</h3>
              </div>
              {!isEmpty && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs text-gray-300 bg-gray-700/50">
                    {filteredData.length} of {totalFields} insights
                  </Badge>
                  {hiddenFields > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                      {hiddenFields} system fields hidden
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyData}
                    className="h-8 px-3 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50"
                    disabled={isEmpty}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="text-xs">Copy All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy all insights to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Enhanced Search */}
          {!isEmpty && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search insights, keywords, demographics, behaviors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm bg-gray-800/50 border-gray-600/50 text-gray-300 placeholder-gray-500 focus:border-blue-400/50 focus:ring-blue-400/20"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-gray-400 hover:text-gray-200"
                  >
                    <span className="text-lg">&times;</span>
                  </Button>
                )}
              </div>
              {searchTerm && (
                <div className="text-xs text-gray-400">
                  {hasResults ? `Found ${filteredData.length} matches` : 'No matches found'}
                </div>
              )}
            </div>
          )}
        </div>
      
      {/* Content */}
      <div className="flex-1 min-h-0">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center text-gray-500 max-w-sm">
              <div className="mb-4">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-600/50" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Survey Data</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Start a conversation with survey questions to see detailed insights and data analysis here.
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Ask about demographics and preferences</p>
                <p>• Explore behavioral patterns</p>
                <p>• Discover satisfaction metrics</p>
              </div>
            </div>
          </div>
        ) : !hasResults ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center text-gray-500 max-w-sm">
              <div className="mb-4">
                <Search className="h-16 w-16 mx-auto text-gray-600/50" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Matching Results</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                We couldn't find any insights matching "<span className="text-blue-400 font-medium">{searchTerm}</span>". 
                Try different keywords or browse all available data.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                >
                  Clear Search
                </Button>
                <p className="text-xs text-gray-600">
                  Total available: {totalFields} fields ({hiddenFields} system fields)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {filteredData.map(([key, value], index) => (
                <div key={key} className="group relative bg-gradient-to-r from-gray-800/40 to-gray-700/20 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 hover:shadow-lg">
                  {/* Enhanced Field Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getIconForField(key)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-blue-300 truncate">
                          {formatFieldLabel(key)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs text-gray-400 bg-gray-800/50">
                            Insight {index + 1}
                          </Badge>
                          {typeof value === 'string' && value.length > 200 && (
                            <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                              Detailed Content
                            </Badge>
                          )}
                          {Array.isArray(value) && value.length > 1 && (
                            <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">
                              {value.length} items
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const dataText = `${formatFieldLabel(key)}: ${value}`;
                        navigator.clipboard.writeText(dataText);
                        toast({
                          title: "Copied",
                          description: "Insight copied to clipboard",
                        });
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy this insight"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Separator */}
                  <Separator className="mb-3 bg-gray-600/30" />
                  
                  {/* Enhanced Content Display */}
                  <div className="space-y-2">
                    {renderDataValue(value, key)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
    </TooltipProvider>
  );
};