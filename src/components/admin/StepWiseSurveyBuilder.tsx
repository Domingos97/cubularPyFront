import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Target, 
  Users, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Brain,
  Heart,
  Briefcase,
  BookOpen,
  TrendingUp,
  DollarSign,
  Building,
  School,
  UserCheck,
  ShoppingCart,
  BarChart3,
  Search,
  TestTube,
  Lightbulb,
  MessageSquare,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedApiRequest } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/resources/i18n';

interface StepWiseSurveyBuilderProps {
  onClose?: () => void;
}

interface SurveyFormData {
  targetAudience: string;
  audienceCustom: string;
  category: string;
  categoryCustom: string;
  objective: string;
  objectiveCustom: string;
  additionalNotes: string;
  surveyTitle: string;
}

interface AudienceOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface CategoryOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ObjectiveOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: 'students',
    label: 'Students',
    description: 'Educational surveys for students and learners',
    icon: <School className="w-5 h-5" />
  },
  {
    id: 'professionals',
    label: 'Professionals',
    description: 'Business professionals and working adults',
    icon: <Briefcase className="w-5 h-5" />
  },
  {
    id: 'consumers',
    label: 'Consumers',
    description: 'General consumers and shoppers',
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Company employees and team members',
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'general',
    label: 'General Public',
    description: 'General population survey',
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 'custom',
    label: 'Custom Audience',
    description: 'Define your own target audience',
    icon: <UserCheck className="w-5 h-5" />
  }
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'gambling',
    label: 'Gambling & Gaming',
    description: 'Gambling behavior, gaming preferences, risk assessment',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Learning experiences, educational assessment',
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    id: 'health',
    label: 'Health & Wellness',
    description: 'Health behaviors, wellness surveys, medical research',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'marketing',
    label: 'Marketing Research',
    description: 'Product research, brand awareness, market analysis',
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    id: 'customer_satisfaction',
    label: 'Customer Satisfaction',
    description: 'Service quality, customer experience, feedback',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'hr',
    label: 'Human Resources',
    description: 'Employee engagement, workplace culture, recruiting',
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'research',
    label: 'Academic Research',
    description: 'Scientific studies, social research, data collection',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'custom',
    label: 'Custom Category',
    description: 'Define your own survey category',
    icon: <FileText className="w-5 h-5" />
  }
];

const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    id: 'test_idea',
    label: 'Test an Idea',
    description: 'Validate concepts, test hypotheses, gauge interest',
    icon: <TestTube className="w-5 h-5" />
  },
  {
    id: 'satisfaction',
    label: 'Check Satisfaction Levels',
    description: 'Measure satisfaction, identify pain points',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'market_research',
    label: 'Market Research',
    description: 'Understand market trends, competitive analysis',
    icon: <Search className="w-5 h-5" />
  },
  {
    id: 'correlations',
    label: 'Find Correlations',
    description: 'Identify relationships between variables, behavioral patterns',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'academic',
    label: 'Academic Research',
    description: 'Scientific studies, data collection for research',
    icon: <Brain className="w-5 h-5" />
  },
  {
    id: 'feedback',
    label: 'Collect Feedback',
    description: 'Gather opinions, suggestions, and recommendations',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 'improvement',
    label: 'Process Improvement',
    description: 'Identify areas for improvement, optimization',
    icon: <Lightbulb className="w-5 h-5" />
  },
  {
    id: 'custom',
    label: 'Custom Objective',
    description: 'Define your own survey objective',
    icon: <Target className="w-5 h-5" />
  }
];

export const StepWiseSurveyBuilder: React.FC<StepWiseSurveyBuilderProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<SurveyFormData>({
    targetAudience: '',
    audienceCustom: '',
    category: '',
    categoryCustom: '',
    objective: '',
    objectiveCustom: '',
    additionalNotes: '',
    surveyTitle: ''
  });

  const navigate = useNavigate();
  const { t } = useTranslation();

  const totalSteps = 4; // Target Audience, Category, Objective, Review & Generate

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Target Audience
        if (!formData.targetAudience) {
          toast.error(t('surveyBuilder.validation.selectAudience') || 'Please select a target audience');
          return false;
        }
        if (formData.targetAudience === 'custom' && !formData.audienceCustom.trim()) {
          toast.error(t('surveyBuilder.validation.customAudience') || 'Please describe your custom target audience');
          return false;
        }
        return true;
      
      case 2: // Category
        if (!formData.category) {
          toast.error(t('surveyBuilder.validation.selectCategory') || 'Please select a survey category');
          return false;
        }
        if (formData.category === 'custom' && !formData.categoryCustom.trim()) {
          toast.error(t('surveyBuilder.validation.customCategory') || 'Please describe your custom category');
          return false;
        }
        return true;
      
      case 3: // Objective
        if (!formData.objective) {
          toast.error(t('surveyBuilder.validation.selectObjective') || 'Please select a survey objective');
          return false;
        }
        if (formData.objective === 'custom' && !formData.objectiveCustom.trim()) {
          toast.error(t('surveyBuilder.validation.customObjective') || 'Please describe your custom objective');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const generateSurvey = async () => {
    if (!formData.surveyTitle.trim()) {
      toast.error(t('surveyBuilder.validation.surveyTitle') || 'Please enter a survey title');
      return;
    }

    setIsGenerating(true);
    try {
      // Build survey description from form data
      const audienceText = formData.targetAudience === 'custom' 
        ? formData.audienceCustom 
        : AUDIENCE_OPTIONS.find(opt => opt.id === formData.targetAudience)?.label || '';

      const categoryText = formData.category === 'custom' 
        ? formData.categoryCustom 
        : CATEGORY_OPTIONS.find(opt => opt.id === formData.category)?.label || '';

      const objectiveText = formData.objective === 'custom' 
        ? formData.objectiveCustom 
        : OBJECTIVE_OPTIONS.find(opt => opt.id === formData.objective)?.label || '';

      const surveyDescription = `Survey for ${audienceText} focusing on ${categoryText}. Objective: ${objectiveText}. ${formData.additionalNotes ? 'Additional requirements: ' + formData.additionalNotes : ''}`;

      // Create structured conversation that mimics the chat-based approach
      const conversation = [
        {
          sender: 'user',
          content: `I want to create a survey titled "${formData.surveyTitle}". The target audience is ${audienceText}.`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'assistant',
          content: `Great! I understand you want to create a survey for ${audienceText}. What category does this survey fall under?`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'user',
          content: `The survey category is ${categoryText}.`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'assistant',
          content: `Perfect! A ${categoryText} survey for ${audienceText}. What is the main objective of this survey?`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'user',
          content: `The objective is to ${objectiveText}.${formData.additionalNotes ? ` Additional notes: ${formData.additionalNotes}` : ''}`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'assistant',
          content: `Excellent! I have all the information needed to create your survey. I'll generate a comprehensive survey with appropriate question types for your ${categoryText} survey targeting ${audienceText} to ${objectiveText}.`,
          timestamp: new Date().toISOString()
        }
      ];

      const surveyData = {
        conversation,
        survey_title: formData.surveyTitle,
        requirements: {
          objective: true,
          targetAudience: true,
          questionTypes: true,
          questionCount: true,
          additionalRequirements: !!formData.additionalNotes
        },
        analysis: {
          objective_identified: true,
          audience_defined: true,
          question_types_specified: true,
          question_count_provided: true,
          additional_requirements: !!formData.additionalNotes
        },
        structured_input: {
          target_audience: audienceText,
          category: categoryText,
          objective: objectiveText,
          additional_notes: formData.additionalNotes,
          title: formData.surveyTitle
        }
      };

      console.log('🏗️ Generating survey with structured data:', surveyData);

      const response = await authenticatedApiRequest('/api/v1/survey-builder/generate-survey', {
        method: 'POST',
        body: JSON.stringify(surveyData)
      });

      if (response.success) {
        toast.success(`🎉 Survey generated successfully! ${response.survey_info.questions_count} questions created.`);
        
        // Reset form
        setFormData({
          targetAudience: '',
          audienceCustom: '',
          category: '',
          categoryCustom: '',
          objective: '',
          objectiveCustom: '',
          additionalNotes: '',
          surveyTitle: ''
        });
        setCurrentStep(1);
        
        // Navigate to survey details or surveys list
        if (response.survey_info.id) {
          navigate(`/admin/survey/${response.survey_info.id}`);
        } else {
          navigate('/admin?tab=surveys');
        }
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('🏗️ Error generating survey:', error);
      toast.error('Failed to generate survey. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>Audience</span>
        <span>Category</span>
        <span>Objective</span>
        <span>Generate</span>
      </div>
    </div>
  );

  const renderTargetAudienceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('surveyBuilder.step.targetAudience.title') || 'Who is your target audience?'}</h2>
        <p className="text-gray-400">{t('surveyBuilder.step.targetAudience.subtitle') || 'Select the primary group who will take your survey'}</p>
      </div>

      <RadioGroup
        value={formData.targetAudience}
        onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {AUDIENCE_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label
              htmlFor={option.id}
              className="flex-1 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="text-blue-400 mt-1">
                  {option.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {formData.targetAudience === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="audience-custom" className="text-white">Describe your target audience</Label>
          <Textarea
            id="audience-custom"
            placeholder="e.g., Working parents aged 25-40, Small business owners, College seniors..."
            value={formData.audienceCustom}
            onChange={(e) => setFormData(prev => ({ ...prev, audienceCustom: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            rows={3}
          />
        </div>
      )}
    </div>
  );

  const renderCategoryStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('surveyBuilder.step.category.title') || 'What category best describes your survey?'}</h2>
        <p className="text-gray-400">{t('surveyBuilder.step.category.subtitle') || 'Choose the main focus or domain of your survey'}</p>
      </div>

      <RadioGroup
        value={formData.category}
        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {CATEGORY_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={`category-${option.id}`} />
            <Label
              htmlFor={`category-${option.id}`}
              className="flex-1 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="text-green-400 mt-1">
                  {option.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {formData.category === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="category-custom" className="text-white">Describe your survey category</Label>
          <Textarea
            id="category-custom"
            placeholder="e.g., Environmental awareness, Technology adoption, Social media usage..."
            value={formData.categoryCustom}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryCustom: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            rows={3}
          />
        </div>
      )}
    </div>
  );

  const renderObjectiveStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('surveyBuilder.step.objective.title') || "What's your main objective?"}</h2>
        <p className="text-gray-400">{t('surveyBuilder.step.objective.subtitle') || 'What do you want to achieve with this survey?'}</p>
      </div>

      <RadioGroup
        value={formData.objective}
        onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {OBJECTIVE_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={`objective-${option.id}`} />
            <Label
              htmlFor={`objective-${option.id}`}
              className="flex-1 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="text-purple-400 mt-1">
                  {option.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.description}</div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {formData.objective === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="objective-custom" className="text-white">Describe your survey objective</Label>
          <Textarea
            id="objective-custom"
            placeholder="e.g., Understand user preferences for new product features, Assess impact of recent policy changes..."
            value={formData.objectiveCustom}
            onChange={(e) => setFormData(prev => ({ ...prev, objectiveCustom: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            rows={3}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="additional-notes" className="text-white">Additional Requirements (Optional)</Label>
        <Textarea
          id="additional-notes"
          placeholder="e.g., Include demographic questions, Keep it under 10 questions, Use rating scales..."
          value={formData.additionalNotes}
          onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          rows={3}
        />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const audienceText = formData.targetAudience === 'custom' 
      ? formData.audienceCustom 
      : AUDIENCE_OPTIONS.find(opt => opt.id === formData.targetAudience)?.label || '';

    const categoryText = formData.category === 'custom' 
      ? formData.categoryCustom 
      : CATEGORY_OPTIONS.find(opt => opt.id === formData.category)?.label || '';

    const objectiveText = formData.objective === 'custom' 
      ? formData.objectiveCustom 
      : OBJECTIVE_OPTIONS.find(opt => opt.id === formData.objective)?.label || '';

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('surveyBuilder.step.review.title') || 'Review & Generate Survey'}</h2>
        <p className="text-gray-400">{t('surveyBuilder.step.review.subtitle') || 'Review your selections and generate your custom survey'}</p>
        </div>

        <div className="space-y-4">
          {/* Survey Title */}
          <div className="space-y-2">
            <Label htmlFor="survey-title" className="text-white">Survey Title *</Label>
            <Input
              id="survey-title"
              placeholder="e.g., Customer Satisfaction Survey 2024"
              value={formData.surveyTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, surveyTitle: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-400" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">{audienceText}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">{categoryText}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center">
                  <Target className="w-4 h-4 mr-2 text-purple-400" />
                  Objective
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">{objectiveText}</p>
              </CardContent>
            </Card>
          </div>

          {formData.additionalNotes && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white">Additional Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">{formData.additionalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="pt-4">
          <Button
            onClick={generateSurvey}
            disabled={isGenerating || !formData.surveyTitle.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Survey...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Generate Survey
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderTargetAudienceStep();
      case 2:
        return renderCategoryStep();
      case 3:
        return renderObjectiveStep();
      case 4:
        return renderReviewStep();
      default:
        return renderTargetAudienceStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
            AI Survey Builder
          </CardTitle>
          {renderProgressBar()}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderCurrentStep()}
          
          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between pt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="flex justify-start pt-6">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StepWiseSurveyBuilder;