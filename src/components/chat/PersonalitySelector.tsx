import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain } from 'lucide-react';
import { usePersonalities } from '@/hooks/usePersonalities';

interface PersonalitySelectorProps {
  onPersonalityChange?: (personalityId: string) => void;
  className?: string;
  value?: string;
  context?: 'ai_chat_integration' | 'survey_builder' | 'all';
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  onPersonalityChange,
  className,
  value,
  context = 'all'
}) => {
  const { 
    personalities, 
    selectedPersonality, 
    updateUserPreference,
    isLoading 
  } = usePersonalities(context);


  // Only notify parent component when selectedPersonality changes from the hook
  // if no explicit value is provided (i.e., when the component is uncontrolled)
  useEffect(() => {
    if (!value && selectedPersonality && onPersonalityChange) {
      console.log('🔍 PersonalitySelector: Auto-selecting personality from user preferences:', selectedPersonality.id);
      onPersonalityChange(selectedPersonality.id);
    }
  }, [selectedPersonality, value, onPersonalityChange]); // Only auto-select if no value is controlled

  const handlePersonalityChange = (personalityId: string) => {
    updateUserPreference(personalityId);
    onPersonalityChange?.(personalityId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Brain className="h-4 w-4" />
        <span>Loading personalities...</span>
      </div>
    );
  }

  // Determine labels for the currently selected personality
  // Prioritize explicit value prop over hook's selectedPersonality
  const currentPersonalityId = value || selectedPersonality?.id || '';
  const currentPersonality = personalities.find(p => p.id === currentPersonalityId);
  const labels = [];

  if (currentPersonality?.is_default) {
    labels.push('default');
  }
  // A personality is "preferred" if it's the one stored as the user's preference (selectedPersonality from hook)
  if (currentPersonality && selectedPersonality && currentPersonality.id === selectedPersonality.id) {
    labels.push('preferred');
  }

  console.log('🔍 PersonalitySelector: Rendering with value:', value, 'selectedPersonality:', selectedPersonality?.id, 'currentPersonalityId:', currentPersonalityId);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Brain className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={currentPersonalityId} 
        onValueChange={handlePersonalityChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select AI Personality" />
        </SelectTrigger>
        <SelectContent>
          {personalities.map((personality) => (
            <SelectItem key={personality.id} value={personality.id}>
              <span>{personality.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {labels.length > 0 && (
        <div className="flex items-center space-x-1">
          {labels.map((label, index) => (
            <span key={label} className="text-xs text-gray-400">
              {label}{index < labels.length - 1 && ','}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};