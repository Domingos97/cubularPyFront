export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly';
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  badge?: string;
}

export interface PlanLimits {
  maxSurveys: number | 'unlimited';
  maxResponses: number | 'unlimited';
  maxUsers: number | 'unlimited';
  maxStorage: string; // e.g., "10GB", "unlimited"
  aiAnalysis: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

export interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'pending';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
  usage: PlanUsage;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PlanUsage {
  surveysUsed: number;
  responsesUsed: number;
  usersUsed: number;
  storageUsed: string;
  lastUpdated: string;
}

export interface PlanUpgradeRequest {
  planId: string;
  billing: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface PlanUpgradeResponse {
  success: boolean;
  message: string;
  redirectUrl?: string; // For external payment processing
  confirmationId?: string;
}

export const AVAILABLE_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for getting started with survey analysis',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Up to 3 surveys',
      'Up to 100 responses per survey',
      'Basic AI analysis',
      'Community support',
      'Export to CSV'
    ],
    limits: {
      maxSurveys: 3,
      maxResponses: 100,
      maxUsers: 1,
      maxStorage: '500MB',
      aiAnalysis: true,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false
    }
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    description: 'Advanced features for professional survey analysis',
    price: 29,
    currency: 'USD',
    billing: 'monthly',
    popular: true,
    features: [
      'Unlimited surveys',
      'Up to 10,000 responses per month',
      'Advanced AI insights',
      'Priority email support',
      'Export to multiple formats',
      'Team collaboration (up to 5 users)',
      'Custom branding'
    ],
    limits: {
      maxSurveys: 'unlimited',
      maxResponses: 10000,
      maxUsers: 5,
      maxStorage: '10GB',
      aiAnalysis: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: false
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: 99,
    currency: 'USD',
    billing: 'monthly',
    badge: 'Contact Sales',
    features: [
      'Everything in Pro',
      'Unlimited responses',
      'Unlimited users',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment options'
    ],
    limits: {
      maxSurveys: 'unlimited',
      maxResponses: 'unlimited',
      maxUsers: 'unlimited',
      maxStorage: 'unlimited',
      aiAnalysis: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true
    }
  }
];