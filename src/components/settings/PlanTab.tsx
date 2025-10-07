import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Crown, 
  CreditCard, 
  Users, 
  Database, 
  BarChart3, 
  Zap, 
  Shield,
  ArrowRight,
  Star
} from 'lucide-react';
import { Plan, UserPlan, AVAILABLE_PLANS, PlanUpgradeRequest } from '@/types/plan';
import { authenticatedFetch } from '@/utils/api';
import { useTranslation } from '@/resources/i18n';

interface PlanTabProps {
  className?: string;
}

export const PlanTab = ({ className }: PlanTabProps) => {
  const [currentPlan, setCurrentPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to get translated plan descriptions
  const getPlanDescription = (planId: string): string => {
    switch (planId) {
      case 'free':
        return t('plans.perfectForGettingStarted');
      case 'pro':
        return t('plans.advancedFeatures');
      case 'enterprise':
        return t('plans.completeSolution');
      default:
        return t('plans.perfectForGettingStarted');
    }
  };

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data);
      } else {
        // Fallback to free plan if no plan found
        const freePlan = AVAILABLE_PLANS.find(p => p.id === 'free');
        if (freePlan) {
          setCurrentPlan({
            id: 'temp-free',
            userId: 'current-user',
            planId: 'free',
            plan: freePlan,
            status: 'active',
            startDate: new Date().toISOString(),
            autoRenew: false,
            usage: {
              surveysUsed: 0,
              responsesUsed: 0,
              usersUsed: 1,
              storageUsed: '0MB',
              lastUpdated: new Date().toISOString()
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plan information',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanUpgrade = async (plan: Plan) => {
    if (!currentPlan || plan.id === currentPlan.planId) return;

    setIsUpgrading(plan.id);
    
    try {
      const upgradeRequest: PlanUpgradeRequest = {
        planId: plan.id,
        billing: 'monthly'
      };

      const response = await authenticatedFetch('/api/user/plan/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upgradeRequest)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Plan Updated',
            description: `Successfully upgraded to ${plan.displayName} plan`,
          });
          await fetchCurrentPlan(); // Refresh current plan
        } else {
          toast({
            title: 'Upgrade Failed',
            description: result.message || 'Failed to upgrade plan',
            variant: 'destructive'
          });
        }
      } else {
        throw new Error('Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to upgrade plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  const getUsagePercentage = (used: number, limit: number | 'unlimited'): number => {
    if (limit === 'unlimited') return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number | 'unlimited'): string => {
    return limit === 'unlimited' ? t('settings.plan.unlimited') : limit.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-400">{t('settings.plan.failedToLoad')}</p>
              <Button 
                onClick={fetchCurrentPlan}
                variant="outline"
                className="mt-4"
              >
                {t('settings.plan.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Plan Overview */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t('settings.plan.currentPlan')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.plan.activeSubscriptionUsage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                {currentPlan.plan.displayName}
                {currentPlan.plan.popular && (
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                    <Star className="h-3 w-3 mr-1" />
                    {t('settings.plan.popular')}
                  </Badge>
                )}
              </h3>
              <p className="text-gray-400">{getPlanDescription(currentPlan.plan.id)}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${currentPlan.plan.price}
                <span className="text-sm font-normal text-gray-400">
                  /{currentPlan.plan.billing === 'monthly' ? t('settings.plan.monthly') : t('settings.plan.yearly')}
                </span>
              </div>
              <Badge 
                variant={currentPlan.status === 'active' ? 'default' : 'secondary'}
                className={
                  currentPlan.status === 'active' 
                    ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                    : 'bg-gray-600/20 text-gray-400'
                }
              >
                {currentPlan.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Usage Statistics */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-200">{t('settings.plan.usageThisMonth')}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('settings.plan.surveys')}
                  </span>
                  <span className="text-sm text-gray-300">
                    {currentPlan.usage.surveysUsed} / {formatLimit(currentPlan.plan.limits.maxSurveys)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.surveysUsed, currentPlan.plan.limits.maxSurveys)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t('settings.plan.responses')}
                  </span>
                  <span className="text-sm text-gray-300">
                    {currentPlan.usage.responsesUsed} / {formatLimit(currentPlan.plan.limits.maxResponses)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.responsesUsed, currentPlan.plan.limits.maxResponses)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('settings.plan.users')}
                  </span>
                  <span className="text-sm text-gray-300">
                    {currentPlan.usage.usersUsed} / {formatLimit(currentPlan.plan.limits.maxUsers)}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.usersUsed, currentPlan.plan.limits.maxUsers)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Storage
                  </span>
                  <span className="text-sm text-gray-300">
                    {currentPlan.usage.storageUsed} / {currentPlan.plan.limits.maxStorage}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">{t('plans.availablePlans')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t('plans.chooseThePlan')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AVAILABLE_PLANS.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan.planId;
              const canUpgrade = !isCurrentPlan && plan.price > currentPlan.plan.price;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 ${
                    isCurrentPlan
                      ? 'border-blue-600 bg-blue-950/20'
                      : plan.popular
                      ? 'border-yellow-600/50 bg-yellow-950/10'
                      : 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-600 text-yellow-100 px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        {t('plans.mostPopular')}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
                      <p className="text-sm text-gray-400">{getPlanDescription(plan.id)}</p>
                    </div>

                    <div className="text-3xl font-bold text-white">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-400">
                        /{plan.billing === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button disabled className="w-full" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : canUpgrade ? (
                        <Button
                          onClick={() => handlePlanUpgrade(plan)}
                          disabled={isUpgrading === plan.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isUpgrading === plan.id ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                              Upgrading...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Upgrade Now
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      ) : plan.badge === 'Contact Sales' ? (
                        <Button variant="outline" className="w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Contact Sales
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Not Available
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      {currentPlan.paymentMethod && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 bg-gray-700 rounded flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {currentPlan.paymentMethod.brand} ****{currentPlan.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-400">
                    Expires {currentPlan.paymentMethod.expiryMonth}/{currentPlan.paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};