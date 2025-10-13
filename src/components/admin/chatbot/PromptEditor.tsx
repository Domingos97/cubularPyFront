import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PromptEditorProps {
  selectedFunction: 'semantic-chat' | 'generate-survey-suggestions';
  prompts: {
    suggestions_prompt: string;
  };
  onPromptsChange: (prompts: {  suggestions_prompt: string }) => void;
}

export const PromptEditor = ({ selectedFunction, prompts, onPromptsChange }: PromptEditorProps) => {
  const updatePrompt = (field:  'suggestions_prompt', value: string) => {
    onPromptsChange({
      ...prompts,
      [field]: value
    });
  };


  return (
    <div className="space-y-2">
      <Label className="text-gray-300 flex items-center gap-2">
        Survey Suggestions Prompt
        <Badge variant="secondary" className="text-xs">Generate Suggestions Function</Badge>
      </Label>
      <p className="text-sm text-gray-400">
        This prompt is used for generating analytical questions about survey data. Use {`{category}`} and {`{description}`} as placeholders.
      </p>
      <Textarea
        value={prompts.suggestions_prompt}
        onChange={(e) => updatePrompt('suggestions_prompt', e.target.value)}
        placeholder="Enter instructions for generating survey questions. Use {category} and {description} placeholders..."
        className="min-h-[300px] bg-gray-700 border-gray-600 text-white font-mono text-sm"
      />
      <div className="text-sm text-gray-400">
        {prompts.suggestions_prompt.length} characters
      </div>
    </div>
  );
};
