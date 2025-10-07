import React, { useState, useEffect } from "react";
import { CheckCircle2, FileText, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Survey } from "@/types/survey";
import { useTranslation } from "@/resources/i18n";

interface EnhancedSurveyCardProps {
  survey: Survey;
  isSelected: boolean;
  onToggle: (survey: Survey) => void;
}

const EnhancedSurveyCard: React.FC<EnhancedSurveyCardProps> = ({ 
  survey, 
  isSelected, 
  onToggle 
}) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onToggle(survey)}
      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
          : 'bg-gray-800/80 border-gray-700/50 hover:bg-gray-700/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="text-lg font-medium text-white/90">
              {survey.title || survey.filename || t('survey.untitledSurvey')}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs capitalize">
                {survey.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>
                {typeof survey.number_participants === 'number' 
                  ? survey.number_participants === 1 
                    ? `1 ${t('survey.participants')}` 
                    : `${survey.number_participants} ${t('survey.participantsPlural')}`
                  : `0 ${t('survey.participantsPlural')}`}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(survey.created_at || survey.createdat || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {isSelected && (
          <CheckCircle2 className="w-6 h-6 text-blue-400 ml-4" />
        )}
      </div>
    </div>
  );
};

export default EnhancedSurveyCard;