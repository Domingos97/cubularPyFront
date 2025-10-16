import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Sparkles, 
  MessageSquare, 
  ArrowRight,
  Target,
  Users,
  FileText,
  CheckCircle,
  Brain,
  Zap
} from 'lucide-react';
import { StepWiseSurveyBuilder } from './StepWiseSurveyBuilder';

export const SurveyBuilderPanel = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState<'stepwise' | 'chat'>('stepwise');

  const features = [
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Smart Targeting',
      description: 'Define your audience with precision'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI-Powered',
      description: 'Intelligent question generation'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Quick Setup',
      description: 'Create surveys in minutes'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Professional Output',
      description: 'Ready-to-use survey files'
    }
  ];

  const handleStartBuilder = (mode: 'stepwise' | 'chat') => {
    setBuilderMode(mode);
    setShowBuilder(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">AI Survey Builder</h2>
          <p className="text-gray-400 text-lg">
            Create professional surveys with AI assistance in just a few steps
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-600 text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Builder Options */}
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Choose Your Survey Creation Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recommended: Step-wise Builder */}
          <div className="relative">
            <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs">
              Recommended
            </Badge>
            <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-600/50 hover:border-blue-500 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Guided Step-by-Step Builder</h3>
                    <p className="text-gray-300 mb-4">
                      Perfect for beginners! Follow our guided process to define your target audience, 
                      category, and objectives through simple selection forms.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-blue-300 border-blue-400">
                        Easy to use
                      </Badge>
                      <Badge variant="outline" className="text-blue-300 border-blue-400">
                        Structured approach
                      </Badge>
                      <Badge variant="outline" className="text-blue-300 border-blue-400">
                        Quick setup
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => handleStartBuilder('stepwise')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start Guided Builder
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alternative: Chat Builder */}
          <Card className="bg-gray-800/50 border-gray-600 hover:border-gray-500 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Conversational AI Builder</h3>
                  <p className="text-gray-300 mb-4">
                    For advanced users who prefer natural conversation. Chat with our AI to 
                    describe your survey needs in your own words.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-gray-400 border-gray-500">
                      Natural language
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 border-gray-500">
                      Flexible input
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 border-gray-500">
                      Advanced features
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => handleStartBuilder('chat')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled
                  >
                    Coming Soon
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Recent Activity or Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">Fast</div>
            <div className="text-sm text-gray-400">Create in 3 steps</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">Smart</div>
            <div className="text-sm text-gray-400">AI-powered questions</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">Ready</div>
            <div className="text-sm text-gray-400">Export CSV & Excel</div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Builder Modal */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-transparent border-none p-0">
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <DialogHeader className="p-6 border-b border-gray-700">
              <DialogTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
                Create New Survey
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              {builderMode === 'stepwise' && (
                <StepWiseSurveyBuilder onClose={() => setShowBuilder(false)} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurveyBuilderPanel;