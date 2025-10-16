import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import NotificationRequestModal from '@/components/notifications/NotificationRequestModal';
import { 
  Mail, 
  CreditCard, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  FileText
} from 'lucide-react';
import { useTranslation } from '@/resources/i18n';

interface SubscriptionTabProps {
  className?: string;
}

export const SubscriptionTab = ({ className }: SubscriptionTabProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDownloadInvoice = () => {
    // TODO: Implement invoice download
    toast({
      title: t('settings.subscription.downloadStarted'),
      description: t('settings.subscription.invoiceDownloading'),
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('settings.subscription.currentSubscription')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.subscription.activeSubscriptionDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-blue-400">{t('settings.subscription.pilotProgram')}</h3>
                  <Badge className="bg-blue-600/20 text-blue-400 px-3 py-1 border-blue-600/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('settings.subscription.active')}
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm">
                  {t('settings.subscription.earlyAccess')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">$0</div>
                <p className="text-sm text-gray-400">{t('settings.subscription.complimentaryAccess')}</p>
              </div>
            </div>
            
            <Separator className="bg-blue-700/30 my-4" />
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              {t('settings.subscription.pilotDescription')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-400">{t('settings.subscription.programBenefits')}</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('settings.subscription.unlimitedSurveys')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('settings.subscription.prioritySupport')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('settings.subscription.earlyAccessFeatures')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('settings.subscription.directFeedback')}
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-400">{t('settings.subscription.programDuration')}</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>{t('settings.subscription.started')}: January 2024</p>
                  <p>{t('settings.subscription.status')}: {t('settings.subscription.ongoing')}</p>
                  <p>{t('settings.subscription.nextReview')}: March 2024</p>
                </div>
              </div>
            </div>
            
            <NotificationRequestModal onNotificationSent={() => {
              toast({
                title: t('settings.subscription.contactSupport'),
                description: t('settings.subscription.requestSentSuccessfully') || 'Your support request has been sent successfully.',
              });
            }}>
              <Button 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="w-4 h-4" />
                {t('settings.subscription.contactTeam')}
                <ExternalLink className="w-4 h-4" />
              </Button>
            </NotificationRequestModal>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.subscription.billingHistory')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.subscription.viewDownloadStatements')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pilot Program Entry */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{t('settings.subscription.activation')}</p>
                  <p className="text-sm text-gray-400">January 15, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">$0.00</p>
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                  {t('settings.subscription.complimentary')}
                </Badge>
              </div>
            </div>

            {/* Future billing note */}
            <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-400 mb-1">{t('settings.subscription.futureBillingInfo')}</h4>
                <p className="text-sm text-gray-300">
                  {t('settings.subscription.futureBillingDescription')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('settings.subscription.paymentMethod')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.subscription.managePaymentMethods')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">{t('settings.subscription.noPaymentMethodRequired')}</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {t('settings.subscription.pilotProgramNoPayment')}
            </p>
            <Button variant="outline" className="text-gray-300 border-gray-600" disabled>
              {t('settings.subscription.addPaymentMethod')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support & Contact */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">{t('settings.subscription.supportContact')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.subscription.getHelpWithSubscription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NotificationRequestModal onNotificationSent={() => {
              toast({
                title: t('settings.subscription.contactSupport'),
                description: t('settings.subscription.requestSentSuccessfully') || 'Your support request has been sent successfully.',
              });
            }}>
              <Button 
                variant="outline" 
                className="text-gray-300 border-gray-600 hover:bg-gray-700 h-auto p-4"
              >
                <div className="text-center">
                  <Mail className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">{t('settings.subscription.contactSupportTitle')}</div>
                  <div className="text-xs text-gray-500">{t('settings.subscription.getHelpWithBilling')}</div>
                </div>
              </Button>
            </NotificationRequestModal>
            
            <Button 
              variant="outline" 
              className="text-gray-300 border-gray-600 hover:bg-gray-700 h-auto p-4"
              onClick={() => window.open('/help', '_blank')}
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">{t('settings.subscription.helpCenter')}</div>
                <div className="text-xs text-gray-500">{t('settings.subscription.browseFaqsGuides')}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};