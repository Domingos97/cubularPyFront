import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch } from '@/utils/api';
import { Crown, Plus, Calendar, AlertCircle } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '@/config';

interface UserPlan {
  id: string;
  status: string;
  start_date: string;
  end_date?: string;
  trial_ends_at?: string;
  auto_renew: boolean;
  payment_method_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plans: {
    id: string;
    name: string;
    display_name: string;
  };
}

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly';
  is_active: boolean;
}

interface User {
  id: string;
  username: string;
  user_plans?: UserPlan[];
}

interface PlanUsageManagerProps {
  user: User;
  isAdmin?: boolean;
  onUserUpdate?: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const PlanUsageManager: React.FC<PlanUsageManagerProps> = ({ user, isAdmin = false, onUserUpdate }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'assign' | 'change'>('assign');
  
  const activePlan = user.user_plans?.[0];

  useEffect(() => {
    if (isAdmin) {
      fetchAvailablePlans();
    }
  }, [isAdmin]);

  useEffect(() => {
    console.log('User prop changed in PlanUsageManager:', {
      userId: user.id,
      username: user.username,
      plansCount: user.user_plans?.length || 0,
      plans: user.user_plans
    });
  }, [user]);

  useEffect(() => {
  }, [availablePlans]);

  const fetchAvailablePlans = async () => {
    try {
      console.log('Fetching available plans...');
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLANS.AVAILABLE));
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns plans directly, not nested in data.plans
        setAvailablePlans(data || []);
      } else {
        const errorData = await response.text();
      }
    } catch (error) {
    }
  };

  const openAssignPlanDialog = () => {
    setDialogMode('assign');
    setSelectedPlanId('');
    setShowPlanDialog(true);
  };

  const openChangePlanDialog = () => {
    setDialogMode('change');
    setSelectedPlanId('');
    setShowPlanDialog(true);
  };

  const handleCancelPlan = async () => {
    if (!activePlan) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.PLANS.REVOKE(user.id)), 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_plan_id: activePlan.id
          })
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Plan access removed successfully',
          variant: 'default'
        });
        
        setShowPlanDialog(false);
        if (onUserUpdate) {
          onUserUpdate();
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to cancel plan:', errorData);
        toast({
          title: 'Error',
          description: 'Failed to remove plan access',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while removing plan access',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    console.log('Starting plan assignment. Current state:', {
      selectedPlanId,
      userId: user.id,
      userName: user.username,
      availablePlansCount: availablePlans.length
    });

    if (!selectedPlanId) {
      toast({
        title: 'Error',
        description: 'Please select a plan to assign',
        variant: 'destructive'
      });
      return;
    }

    if (!user.id) {
      console.error('User ID is missing:', user);
      toast({
        title: 'Error',
        description: 'User ID is missing',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Send plan_id as query parameter, not in request body
      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.PLANS.ASSIGN(user.id))}?plan_id=${encodeURIComponent(selectedPlanId)}`;
      
      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        // No body needed since plan_id is sent as query parameter
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Plan assigned successfully:', result);
        
        toast({
          title: 'Success',
          description: 'Plan assigned successfully',
          variant: 'default'
        });
        
        setShowPlanDialog(false);
        setSelectedPlanId('');
        
        // Immediately trigger refresh
        if (onUserUpdate) {
          await new Promise(resolve => setTimeout(resolve, 300));
          await onUserUpdate();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign plan');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign plan',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isPlanExpired = () => {
    if (!activePlan?.end_date) return false;
    return new Date(activePlan.end_date) < new Date();
  };

  const isTrialExpired = () => {
    if (!activePlan?.trial_ends_at) return false;
    return new Date(activePlan.trial_ends_at) < new Date();
  };

  const getDaysUntilExpiry = () => {
    if (!activePlan?.end_date) return null;
    const expiryDate = new Date(activePlan.end_date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilTrialExpiry = () => {
    if (!activePlan?.trial_ends_at) return null;
    const trialEndDate = new Date(activePlan.trial_ends_at);
    const today = new Date();
    const diffTime = trialEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t('admin.planUsage.title')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('admin.planUsage.description')}
            </CardDescription>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogTrigger asChild>
                  {activePlan ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                      onClick={openChangePlanDialog}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {t('admin.planUsage.changePlan') || 'Change Plan'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={openAssignPlanDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('admin.planUsage.assignPlan')}
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {dialogMode === 'assign' 
                        ? (t('admin.planUsage.assignPlanTitle') || 'Assign Plan')
                        : (t('admin.planUsage.changePlan') || 'Change Plan')
                      }
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      {dialogMode === 'assign' 
                        ? (t('admin.planUsage.assignPlanDescription', { username: user.username }) || `Assign a plan to ${user.username}`)
                        : (t('admin.planUsage.changePlanDescription', { username: user.username }) || `Change ${user.username}'s current plan`)
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {dialogMode === 'change' && activePlan && (
                      <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">Current Plan</span>
                        </div>
                        <p className="text-gray-300">{activePlan.plans.display_name}</p>
                        <p className="text-sm text-gray-400">
                          Status: {activePlan.status} | Started: {formatDate(activePlan.start_date)}
                          {activePlan.end_date && ` | Expires: ${formatDate(activePlan.end_date)}`}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-300">
                        {dialogMode === 'assign' ? (t('admin.planUsage.selectPlan') || 'Select Plan') : 'New Plan'}
                      </Label>
                      <Select 
                        value={selectedPlanId} 
                        onValueChange={(value) => {
                          console.log('Plan selected:', value);
                          setSelectedPlanId(value);
                        }}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder={t('admin.planUsage.choosePlan') || 'Choose a plan...'} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {availablePlans.length > 0 ? (
                            availablePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id} className="text-white">
                                <div className="flex items-center justify-between w-full">
                                  <span>{plan.display_name}</span>
                                  <span className="text-sm text-gray-400 ml-2">
                                    ${plan.price}/{plan.billing === 'monthly' ? (t('admin.planUsage.monthly') || 'month') : (t('admin.planUsage.yearly') || 'year')}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-plans" disabled className="text-gray-500">
                              No plans available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPlanDialog(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {t('admin.planUsage.cancel') || 'Cancel'}
                      </Button>
                      
                      {dialogMode === 'change' && (
                        <Button
                          variant="destructive"
                          onClick={handleCancelPlan}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Removing...' : 'Remove Plan Access'}
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleAssignPlan}
                        disabled={isLoading || !selectedPlanId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (dialogMode === 'assign' ? (t('admin.planUsage.assigning') || 'Assigning...') : 'Changing...') : (
                          dialogMode === 'assign' ? (t('admin.planUsage.assign') || 'Assign Plan') : 'Change Plan'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
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
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${
                    activePlan.status === 'active' 
                      ? 'text-green-400 border-green-600' 
                      : activePlan.status === 'expired'
                      ? 'text-red-400 border-red-600'
                      : 'text-yellow-400 border-yellow-600'
                  }`}
                >
                  {activePlan.status.toUpperCase()}
                </Badge>
                {isPlanExpired() && (
                  <Badge variant="destructive" className="text-red-400 border-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    EXPIRED
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Expiry Warning */}
            {activePlan.end_date && !isPlanExpired() && (
              (() => {
                const daysLeft = getDaysUntilExpiry();
                if (daysLeft !== null && daysLeft <= 30) {
                  return (
                    <div className={`p-4 rounded-lg border ${
                      daysLeft <= 7 
                        ? 'bg-red-900/20 border-red-500/30 text-red-400'
                        : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">
                          {daysLeft <= 7 ? t('admin.planUsage.planExpiresSoon') : t('admin.planUsage.planExpiring')}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {t('admin.planUsage.planWillExpire', { 
                          days: daysLeft, 
                          plural: daysLeft !== 1 ? 's' : '', 
                          date: formatDate(activePlan.end_date) 
                        })}
                      </p>
                    </div>
                  );
                }
                return null;
              })()
            )}
            
            <Separator className="bg-gray-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('admin.planUsage.startDate')}
                </Label>
                <p className="text-gray-300">{formatDate(activePlan.start_date)}</p>
              </div>
              {activePlan.end_date && (
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('admin.planUsage.endDate')}
                  </Label>
                  <p className={`${isPlanExpired() ? 'text-red-400' : 'text-gray-300'}`}>
                    {formatDate(activePlan.end_date)}
                  </p>
                </div>
              )}
              {activePlan.trial_ends_at && (
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('admin.planUsage.trialEndsAt')}
                  </Label>
                  <p className="text-orange-400">{formatDate(activePlan.trial_ends_at)}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.planId')}</Label>
                <p className="text-gray-300 font-mono text-sm">{activePlan.plans.id}</p>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Subscription Details */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">{t('admin.planUsage.subscriptionDetails')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.autoRenew')}</Label>
                  <div className="text-gray-300">
                    <Badge 
                      variant="outline" 
                      className={`${
                        activePlan.auto_renew 
                          ? 'text-green-400 border-green-600' 
                          : 'text-red-400 border-red-600'
                      }`}
                    >
                      {activePlan.auto_renew ? t('admin.planUsage.autoRenewEnabled') : t('admin.planUsage.autoRenewDisabled')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.createdAt')}</Label>
                  <p className="text-gray-300">{formatDate(activePlan.created_at)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.updatedAt')}</Label>
                  <p className="text-gray-300">{formatDate(activePlan.updated_at)}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Billing Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">{t('admin.planUsage.billingInfo')}</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.paymentMethodId')}</Label>
                  <p className="text-gray-300 font-mono text-sm">
                    {activePlan.payment_method_id || (
                      <span className="text-gray-500 italic">{t('admin.planUsage.noPaymentMethod')}</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.planUsage.stripeSubscriptionId')}</Label>
                  <p className="text-gray-300 font-mono text-sm">
                    {activePlan.stripe_subscription_id || (
                      <span className="text-gray-500 italic">{t('admin.planUsage.noStripeSubscription')}</span>
                    )}
                  </p>
                </div>
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
