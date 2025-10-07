import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number; // 0-100
  reliability: 'high' | 'medium' | 'low';
  factors?: {
    sampleSize?: number;
    dataRelevance?: string;
    questionSpecificity?: string;
    dataCompleteness?: string;
  };
}

export function ConfidenceIndicator({ score, reliability, factors }: ConfidenceIndicatorProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getReliabilityVariant = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatFactors = () => {
    if (!factors) return 'Confidence based on data analysis';
    
    const factorTexts = [];
    if (factors.sampleSize) factorTexts.push(`Sample size: ${factors.sampleSize} responses`);
    if (factors.dataRelevance) factorTexts.push(`Data relevance: ${factors.dataRelevance}`);
    if (factors.questionSpecificity) factorTexts.push(`Question type: ${factors.questionSpecificity}`);
    if (factors.dataCompleteness) factorTexts.push(`Data quality: ${factors.dataCompleteness}`);
    
    return factorTexts.join('\n');
  };

  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-card/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Confidence:</span>
        <span className={`font-medium ${getConfidenceColor(score)}`}>
          {score}%
        </span>
      </div>
      
      <Progress 
        value={score} 
        className="w-16 h-2"
      />
      
      <Badge 
        variant={getReliabilityVariant(reliability)}
        className="text-xs px-1.5 py-0.5"
      >
        {reliability}
      </Badge>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-xs">
              <div className="font-medium mb-1">Confidence Factors:</div>
              <div className="whitespace-pre-line">{formatFactors()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}