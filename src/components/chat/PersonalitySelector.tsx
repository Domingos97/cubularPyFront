import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain } from 'lucide-react';
import { usePersonalities } from '@/hooks/usePersonalities';

interface PersonalitySelectorProps {
  onPersonalityChange?: (personalityId: string) => void;
  className?: string;
  value?: string;
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  onPersonalityChange,
  className,
  value
}) => {
  const { 
    personalities, 
    selectedPersonality, 
    updateUserPreference,
    isLoading 
  } = usePersonalities();


  // Notify parent component when selectedPersonality changes from the hook
  useEffect(() => {
    if (selectedPersonality && selectedPersonality.id !== value) {
      onPersonalityChange?.(selectedPersonality.id);
    }
  }, [selectedPersonality, value, onPersonalityChange]);

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
  const currentPersonalityId = selectedPersonality?.id ?? value ?? '';
  const currentPersonality = personalities.find(p => p.id === currentPersonalityId);
  const labels = [];

  if (currentPersonality?.is_default) {
    labels.push('default');
  }
  // A personality is "preferred" if it's the one stored as the user's preference (selectedPersonality from hook)
  if (currentPersonality && selectedPersonality && currentPersonality.id === selectedPersonality.id) {
    labels.push('preferred');
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Brain className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={selectedPersonality?.id ?? value ?? ''} 
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