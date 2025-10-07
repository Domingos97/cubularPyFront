import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const PROMPT_TEMPLATES = [
  {
    name: "Default Survey Analysis",
    prompt: "You are an expert data analyst specializing in survey research. Analyze the provided survey data and provide comprehensive insights about demographics, trends, and key findings. Focus on actionable recommendations based on the data patterns."
  },
  {
    name: "Customer Feedback Analysis",
    prompt: "You are a customer experience specialist. Analyze the survey responses to identify customer satisfaction patterns, pain points, and opportunities for improvement. Provide specific recommendations for enhancing customer experience."
  },
  {
    name: "Market Research Focus",
    prompt: "You are a market research expert. Examine the survey data to identify market trends, consumer preferences, and competitive insights. Focus on strategic implications and business opportunities."
  },
  {
    name: "Academic Research",
    prompt: "You are an academic researcher. Analyze the survey data with rigorous statistical methodology. Provide detailed statistical analysis, methodology assessment, and scholarly insights with proper statistical significance considerations."
  }
];

interface PromptTemplatesProps {
  onTemplateSelect: (template: typeof PROMPT_TEMPLATES[0]) => void;
}

export const PromptTemplates = ({ onTemplateSelect }: PromptTemplatesProps) => {
  return (
    <div>
      <Label className="text-gray-300 mb-2 block">Prompt Templates</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {PROMPT_TEMPLATES.map((template, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onTemplateSelect(template)}
            className="justify-start text-left border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
};