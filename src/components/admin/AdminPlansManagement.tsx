import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch } from '@/utils/api';
import { Plus, Edit, Trash2, Crown, DollarSign, Calendar, Users } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price: number | string;
  currency: string;
  billing: 'monthly' | 'yearly';
  is_active: boolean;
  features?: string[];
  max_users?: number | string;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  name: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly';
  is_active: boolean;
  features: string;
  max_users: number;
}

const AdminPlansManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    display_name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    is_active: true,
    features: '',
    max_users: 1
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        throw new Error('Failed to fetch plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing: 'monthly',
      is_active: true,
      features: '',
      max_users: 1
    });
  };

  const handleCreatePlan = async () => {
    try {
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim() !== '')
      };

      const response = await authenticatedFetch('http://localhost:8000/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Plan created successfully',
          variant: 'default'
        });
        setShowCreateDialog(false);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create plan');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create plan',
        variant: 'destructive'
      });
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      billing: plan.billing,
      is_active: plan.is_active,
      features: plan.features?.join('\n') || '',
      max_users: Number(plan.max_users) || 1
    });
    setShowEditDialog(true);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim() !== '')
      };

      const response = await authenticatedFetch(`http://localhost:8000/api/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Plan updated successfully',
          variant: 'default'
        });
        setShowEditDialog(false);
        setEditingPlan(null);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update plan');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update plan',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/plans/${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Plan deleted successfully',
          variant: 'default'
        });
        fetchPlans();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete plan');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete plan',
        variant: 'destructive'
      });
    }
  };

  const PlanForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., basic, premium, enterprise"
          />
        </div>
        <div>
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            placeholder="e.g., Basic Plan, Premium Plan"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Plan description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="billing">Billing</Label>
          <Select value={formData.billing} onValueChange={(value: 'monthly' | 'yearly') => handleInputChange('billing', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="max_users">Max Users</Label>
        <Input
          id="max_users"
          type="number"
          min="1"
          value={formData.max_users}
          onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 1)}
        />
      </div>

      <div>
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => handleInputChange('features', e.target.value)}
          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleInputChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            setEditingPlan(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Plans...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Plans Management</h2>
          <p className="text-gray-400">Manage subscription plans and pricing</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan to your platform
              </DialogDescription>
            </DialogHeader>
            <PlanForm onSubmit={handleCreatePlan} submitText="Create Plan" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    {plan.display_name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-lg font-semibold">
                  {plan.currency} {Number(plan.price).toFixed(2)} / {plan.billing}
                </span>
              </div>

              {plan.max_users && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Max {plan.max_users} users</span>
                </div>
              )}

              {plan.features && plan.features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-3 h-3" />
                Created: {new Date(plan.created_at).toLocaleDateString()}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{plan.display_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the plan details
            </DialogDescription>
          </DialogHeader>
          <PlanForm onSubmit={handleUpdatePlan} submitText="Update Plan" />
        </DialogContent>
      </Dialog>

      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No plans yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by creating your first subscription plan
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPlansManagement;
