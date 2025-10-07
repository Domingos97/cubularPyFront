import { Shield, Upload, Database, Bot, BarChart3, Lock, FileSpreadsheet, Users, Check, Info, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/resources/i18n';

const DataCollection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('dataCollection.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('dataCollection.subtitle')}
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <button 
            onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-center hover:bg-blue-600/30 transition-colors"
          >
            <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">{t('dataCollection.nav.dataCollection')}</h3>
          </button>
          <button 
            onClick={() => document.getElementById('processing')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center hover:bg-green-600/30 transition-colors"
          >
            <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">{t('dataCollection.nav.processing')}</h3>
          </button>
          <button 
            onClick={() => document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center hover:bg-purple-600/30 transition-colors"
          >
            <Bot className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">{t('dataCollection.nav.aiAnalysis')}</h3>
          </button>
          <button 
            onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-center hover:bg-red-600/30 transition-colors"
          >
            <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">{t('dataCollection.nav.security')}</h3>
          </button>
        </div>

        {/* Data Collection Section */}
        <div id="collection">
          <GlassCard title="1. Data Collection Process" className="mb-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <FileSpreadsheet className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">File Upload & Formats</h3>
                <p className="text-gray-300 mb-3">
                  Users can upload survey data in CSV or Excel (.xlsx) formats. We support standard survey structures with participant responses, questionnaire data, and demographic information.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">Accepted File Types</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />.csv files</li>
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />.xlsx files</li>
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />UTF-8 encoding</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">Required Information</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />Survey category</li>
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />Description</li>
                      <li className="flex items-center"><Check className="w-3 h-3 text-green-400 mr-2" />Participant count (optional)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Users className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Data Structure Recognition</h3>
                <p className="text-gray-300 mb-3">
                  Our system automatically detects and parses common survey data structures including participant identification (typically 'Pessoa' column), response categories, and data types.
                </p>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-green-300 font-medium mb-2">Automatic Detection</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Headers and column structure</li>
                    <li>• Participant identification columns</li>
                    <li>• Response patterns and data types</li>
                    <li>• Missing data and validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        </div>

        {/* Processing Section */}
        <div id="processing">
          <GlassCard title="2. Data Processing Pipeline" className="mb-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Database className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Storage & Organization</h3>
                <p className="text-gray-300 mb-4">
                  Uploaded files are securely stored in Postgresql Storage with metadata tracking in our database. Each survey gets a unique identifier and is associated with the uploading user.
                </p>
                
                <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Processing Flow
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="bg-blue-600/20 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">1</div>
                      <p className="text-gray-300">File Upload & Validation</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-600/20 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
                      <p className="text-gray-300">Data Parsing & Structure Analysis</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-600/20 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
                      <p className="text-gray-300">Storage & Metadata Creation</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">Data Validation</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• File format verification</li>
                      <li>• Structure integrity checks</li>
                      <li>• Character encoding validation</li>
                      <li>• Size and format limits</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">Metadata Tracking</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Upload timestamp</li>
                      <li>• User association</li>
                      <li>• File size and type</li>
                      <li>• Participant count</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <BarChart3 className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Data Analysis & Insights</h3>
                <p className="text-gray-300 mb-3">
                  Once processed, survey data is made available for analysis through our interface. Users can view, edit, and export their data while maintaining full control over access.
                </p>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-green-300 font-medium mb-2">Analysis Features</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Interactive data tables with editing capabilities</li>
                    <li>• Participant counting and demographic analysis</li>
                    <li>• Data export in original format</li>
                    <li>• Multi-file survey support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        </div>

        {/* AI Analysis Section */}
        <div id="ai">
          <GlassCard title="3. AI-Powered Analysis" className="mb-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Bot className="w-8 h-8 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">AI Personality Integration</h3>
                <p className="text-gray-300 mb-4">
                  Our system uses configurable AI personalities to generate insights and suggestions based on your survey data. Different personalities provide varied analytical perspectives.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-2">AI Analysis Process</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Sample data extraction (limited subset)</li>
                      <li>• Pattern recognition and categorization</li>
                      <li>• Question generation based on content</li>
                      <li>• Insight recommendations</li>
                    </ul>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-2">Privacy Protection</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Only sample data sent to AI (max 100 rows)</li>
                      <li>• No personal identifiers included</li>
                      <li>• Temporary processing only</li>
                      <li>• No data retention by AI providers</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Info className="w-5 h-5 text-purple-400 mr-2" />
                    <h4 className="text-purple-300 font-medium">AI Data Usage Policy</h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    AI analysis is performed on a limited sample of your data (typically the first few rows excluding headers) to generate relevant analysis questions and insights. 
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Maximum 100 rows per analysis request</li>
                    <li>• Headers and sample rows only - no complete datasets</li>
                    <li>• No storage or training on your data by AI providers</li>
                    <li>• Analysis suggestions stored locally in your survey metadata</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        </div>

        {/* Security Section */}
        <div id="security">
          <GlassCard title="4. Security & Privacy Measures" className="mb-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Data Protection</h3>
                <p className="text-gray-300 mb-4">
                  We implement comprehensive security measures to protect your survey data at every stage of the process.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-300 font-medium mb-2 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Authentication & Access
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• JWT token-based authentication</li>
                      <li>• Role-based access control</li>
                      <li>• User isolation - you only see your data</li>
                      <li>• Admin oversight with audit trails</li>
                    </ul>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-300 font-medium mb-2 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      Storage Security
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Encrypted storage via Postegresql</li>
                      <li>• Secure file upload validation</li>
                      <li>• Automatic backup systems</li>
                      <li>• Geographic data replication</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-3">Data Retention & Control</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div>
                      <h5 className="font-medium text-orange-300 mb-2">Your Rights</h5>
                      <ul className="space-y-1">
                        <li>• View all your data</li>
                        <li>• Edit survey information</li>
                        <li>• Export original files</li>
                        <li>• Delete surveys anytime</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-orange-300 mb-2">Data Lifecycle</h5>
                      <ul className="space-y-1">
                        <li>• Stored until you delete</li>
                        <li>• No automatic expiration</li>
                        <li>• Complete removal on deletion</li>
                        <li>• Audit trail maintenance</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-orange-300 mb-2">Compliance</h5>
                      <ul className="space-y-1">
                        <li>• GDPR compliance ready</li>
                        <li>• Data minimization principle</li>
                        <li>• Purpose limitation</li>
                        <li>• Transparent processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        </div>

        {/* Summary & Actions */}
        <GlassCard title="Summary & Next Steps" className="mb-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Key Takeaways</h3>
              <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h4 className="text-blue-300 font-medium mb-2">What We Collect</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Survey files you voluntarily upload</li>
                    <li>• Metadata like categories and descriptions</li>
                    <li>• Analysis results and AI suggestions</li>
                    <li>• User account and activity information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-green-300 font-medium mb-2">How We Protect It</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Encrypted storage and transmission</li>
                    <li>• Access controls and user isolation</li>
                    <li>• Limited AI data processing</li>
                    <li>• Complete user control over data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Analyzing Surveys
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/admin')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {t('common.goToAdminDashboard')}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Footer Note */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-2">
            This explanation covers our current data collection practices as of October 2025.
          </p>
          <p>
            For questions or concerns about data handling, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;