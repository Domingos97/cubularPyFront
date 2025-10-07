import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/resources/i18n';
import { Crown } from 'lucide-react';

interface UserPlan {
  id: string;
  status: string;
  start_date: string;
  end_date?: string;
  plans: {
    id: string;
    name: string;
    display_name: string;
  };
}

interface User {
  id: string;
  username: string;
  user_plans?: UserPlan[];
}

interface PlanUsageManagerProps {
  user: User;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const PlanUsageManager: React.FC<PlanUsageManagerProps> = ({ user }) => {
  const { t } = useTranslation();
  const activePlan = user.user_plans?.[0];

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {t('admin.planUsage.title')}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {t('admin.planUsage.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activePlan ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {activePlan.plans.display_name}
                </h3>
                <p className="text-gray-400">{t('admin.planUsage.currentPlan')}</p>
              </div>
              <Badge 
                variant="outline" 
                className="text-green-400 border-green-600"
              >
                {activePlan.status.toUpperCase()}
              </Badge>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.startDate')}</Label>
                <p className="text-gray-300">{formatDate(activePlan.start_date)}</p>
              </div>
              {activePlan.end_date && (
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.endDate')}</Label>
                  <p className="text-gray-300">{formatDate(activePlan.end_date)}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.planId')}</Label>
                <p className="text-gray-300 font-mono text-sm">{activePlan.plans.id}</p>
              </div>
            </div>
            
            <Separator className="bg-gray-700" />
            
            {/* Usage Statistics */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">{t('admin.planUsage.usageStats')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">0</p>
                      <p className="text-xs text-gray-400">{t('admin.planUsage.surveysAccessed')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">0</p>
                      <p className="text-xs text-gray-400">{t('admin.planUsage.filesDownloaded')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">0</p>
                      <p className="text-xs text-gray-400">{t('admin.planUsage.queriesRun')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">0</p>
                      <p className="text-xs text-gray-400">{t('admin.planUsage.dataProcessed')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Plan Features */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Plan Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Survey Access</span>
                    <Badge variant="outline" className="text-green-400 border-green-600">
                      Unlimited
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">File Downloads</span>
                    <Badge variant="outline" className="text-green-400 border-green-600">
                      Unlimited
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">API Rate Limit</span>
                    <Badge variant="outline" className="text-blue-400 border-blue-600">
                      1000/hour
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Chat Sessions</span>
                    <Badge variant="outline" className="text-green-400 border-green-600">
                      Unlimited
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Data Export</span>
                    <Badge variant="outline" className="text-green-400 border-green-600">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Priority Support</span>
                    <Badge variant="outline" className="text-purple-400 border-purple-600">
                      Premium
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Crown className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">{t('admin.planUsage.noPlan')}</h3>
            <p className="text-gray-500 mb-6">
              {t('admin.planUsage.noPlanDescription')}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-gray-700/30 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-white mb-1">Basic</h4>
                    <p className="text-sm text-gray-400">Limited access</p>
                    <p className="text-lg font-bold text-blue-400 mt-2">Free</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/30 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors border-blue-500/50">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-white mb-1">Pro</h4>
                    <p className="text-sm text-gray-400">Full access</p>
                    <p className="text-lg font-bold text-green-400 mt-2">$19/mo</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700/30 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium text-white mb-1">Enterprise</h4>
                    <p className="text-sm text-gray-400">Advanced features</p>
                    <p className="text-lg font-bold text-purple-400 mt-2">$99/mo</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanUsageManager;