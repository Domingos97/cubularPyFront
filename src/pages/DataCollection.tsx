import React from 'react';
import AppHeader from "@/components/AppHeader";
import { MessageCircle, Brain, Zap, Target, Upload, Search, BarChart3, Users, Check, ArrowRight, Info, Shield, Lock } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useTranslation } from "@/resources/i18n";

const DataCollection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen gradient-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            {t('dataCollection.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('dataCollection.subtitle')}
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <a href="#overview" className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center hover:bg-blue-900/30 transition-colors">
            <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-white font-medium">{t('dataCollection.nav.dataCollection')}</span>
          </a>
          <a href="#processing" className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center hover:bg-purple-900/30 transition-colors">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <span className="text-white font-medium">{t('dataCollection.nav.processing')}</span>
          </a>
          <a href="#examples" className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center hover:bg-green-900/30 transition-colors">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <span className="text-white font-medium">{t('dataCollection.nav.aiAnalysis')}</span>
          </a>
          <a href="#security" className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 text-center hover:bg-orange-900/30 transition-colors">
            <Shield className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <span className="text-white font-medium">{t('dataCollection.nav.security')}</span>
          </a>
        </div>

        {/* Chat System Overview */}
        <div id="overview">
          <GlassCard title={t('dataCollection.overview.title')} className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">{t('dataCollection.overview.heading')}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t('dataCollection.overview.description')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">{t('dataCollection.overview.simpleNatural')}</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.askQuestions')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.instantAnswers')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.noDatabaseKnowledge')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.followUpQuestions')}
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className="text-purple-300 font-semibold text-lg">{t('dataCollection.overview.behindScenes')}</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.processFiles')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.semanticSearch')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.contextAware')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.overview.realTimeAnalysis')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* AI Processing Pipeline */}
        <div id="processing">
          <GlassCard title={t('dataCollection.pipeline.title')} className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">{t('dataCollection.pipeline.heading')}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t('dataCollection.pipeline.description')}
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="w-6 h-6 text-blue-400 mr-3" />
                    <h4 className="text-blue-300 font-semibold text-lg">{t('dataCollection.pipeline.ingestion')}</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      {t('dataCollection.pipeline.csvExcelValidation')}
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-blue-200 font-medium text-sm mb-2">Processing Steps:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.pipeline.fileFormatValidation')}</li>
                        <li>{t('dataCollection.pipeline.characterEncodingDetection')}</li>
                        <li>{t('dataCollection.pipeline.columnStructureAnalysis')}</li>
                        <li>{t('dataCollection.pipeline.dataTypeInference')}</li>
                        <li>{t('dataCollection.pipeline.missingValueHandling')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className="text-purple-300 font-semibold text-lg">{t('dataCollection.pipeline.vectorization')}</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      {t('dataCollection.pipeline.vectorConversion')}
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-purple-200 font-medium text-sm mb-2">AI Techniques:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.pipeline.embeddingGeneration')}</li>
                        <li>{t('dataCollection.pipeline.semanticSimilarityMapping')}</li>
                        <li>{t('dataCollection.pipeline.contextWindowOptimization')}</li>
                        <li>{t('dataCollection.pipeline.vectorDatabaseIndexing')}</li>
                        <li>{t('dataCollection.pipeline.similaritySearchPreparation')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">{t('dataCollection.pipeline.queryProcessing',)}</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      {t('dataCollection.pipeline.questionAnalysis')}
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-green-200 font-medium text-sm mb-2">Response Generation:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.pipeline.intentUnderstanding')}</li>
                        <li>{t('dataCollection.pipeline.semanticSearchExecution')}</li>
                        <li>{t('dataCollection.pipeline.contextRetrieval')}</li>
                        <li>{t('dataCollection.pipeline.llmResponseSynthesis')}</li>
                        <li>{t('dataCollection.pipeline.factVerification')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-900/20 to-red-900/20 border border-amber-500/30 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Target className="w-6 h-6 text-amber-400 mr-3" />
                  <h3 className="text-amber-300 font-semibold text-xl">{t('dataCollection.pipeline.realTimeIntelligence')}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {t('dataCollection.pipeline.conversationContext')}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

  {/* Technical Deep Dive */}
          <GlassCard title={t('dataCollection.technical.title')} className="mb-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="text-white font-semibold text-xl mb-4">{t('dataCollection.technical.heading')}</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {t('dataCollection.technical.howItWorks')}
              </p>
            </div>

            {/* Search Flow */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
                <h4 className="text-emerald-300 font-semibold text-lg mb-4">{t('dataCollection.technical.queryFlow')}</h4>
                <div className="space-y-4 text-sm">
                  <div className="bg-blue-900/30 border-l-4 border-blue-400 p-3 rounded-r">
                    <h5 className="text-blue-200 font-medium mb-1">1. Question Embedding</h5>
                    <p className="text-gray-300">Your question is converted into a 768-dimensional vector using transformer models</p>
                  </div>
                  <div className="bg-purple-900/30 border-l-4 border-purple-400 p-3 rounded-r">
                    <h5 className="text-purple-200 font-medium mb-1">2. Vectorized Search</h5>
                    <p className="text-gray-300">NumPy performs cosine similarity calculations across all survey response vectors simultaneously</p>
                  </div>
                  <div className="bg-green-900/30 border-l-4 border-green-400 p-3 rounded-r">
                    <h5 className="text-green-200 font-medium mb-1">3. Threshold Filtering</h5>
                    <p className="text-gray-300">Results above similarity threshold (0.25) are ranked and processed for demographics</p>
                  </div>
                  <div className="bg-orange-900/30 border-l-4 border-orange-400 p-3 rounded-r">
                    <h5 className="text-orange-200 font-medium mb-1">4. Context Assembly</h5>
                    <p className="text-gray-300">Relevant responses are packaged with metadata and sent to AI for natural language response</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
                <h4 className="text-teal-300 font-semibold text-lg mb-4">{t('dataCollection.technical.performance')}</h4>
                <div className="space-y-3">
                  <div className="bg-gray-700/50 p-3 rounded">
                    <h5 className="text-white font-medium text-sm mb-1">Vectorized Operations</h5>
                    <p className="text-gray-300 text-xs">Processes 10,000+ responses in &lt;100ms using NumPy's optimized C implementations</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded">
                    <h5 className="text-white font-medium text-sm mb-1">Memory Efficiency</h5>
                    <p className="text-gray-300 text-xs">Pickle files store pre-computed embeddings for instant loading without regeneration</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded">
                    <h5 className="text-white font-medium text-sm mb-1">Batch Processing</h5>
                    <p className="text-gray-300 text-xs">Multiple survey files processed in parallel for cross-dataset analysis</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded">
                    <h5 className="text-white font-medium text-sm mb-1">Smart Caching</h5>
                    <p className="text-gray-300 text-xs">Embeddings cached per survey to avoid recomputation on subsequent searches</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Details */}
            <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-500/30 rounded-lg p-6">
              <h4 className="text-violet-300 font-semibold text-lg mb-4">{t('dataCollection.technical.mathFoundation')}</h4>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">{t('dataCollection.technical.cosineSimilarity')}</h5>
                  <p className="text-gray-300 text-sm mb-3">{t('dataCollection.technical.cosineSimilarityExplanation')}</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-green-300">
                    {t('dataCollection.technical.cosineSimilarityFormula')}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t('dataCollection.technical.cosineSimilarityValues')}</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">{t('dataCollection.technical.vectorEmbeddings')}</h5>
                  <p className="text-gray-300 text-sm mb-3">{t('dataCollection.technical.vectorEmbeddingsExplanation')}</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-blue-300">
                    {t('dataCollection.technical.vectorEmbeddingsSample')}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t('dataCollection.technical.vectorEmbeddingsDimensions')}</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">{t('dataCollection.technical.thresholdFiltering')}</h5>
                  <p className="text-gray-300 text-sm mb-3">{t('dataCollection.technical.thresholdFilteringExplanation')}</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-yellow-300">
                    {t('dataCollection.technical.thresholdFilteringSample')}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t('dataCollection.technical.thresholdFilteringDetails')}</p>
                </div>
              </div>
            </div>

            {/* Data Structure Explanation */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-6">
              <h4 className="text-cyan-300 font-semibold text-lg mb-4">{t('dataCollection.technical.dataStructure')}</h4>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-white font-semibold mb-3">{t('dataCollection.technical.semanticDictionary')}</h5>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "cleanedText": "The service was excellent",
  "originalText": "The service was excellent!",
  "metadata": {
    "row": 42,
    "column": "feedback",
    "question": "How was your experience?"
  },
  "demographics": {
    "age": "25-34",
    "gender": "female",
    "location": "urban"
  }
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-white font-semibold mb-3">{t('dataCollection.technical.vectorDatabase')}</h5>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
{`embeddings: numpy.array([
  [0.1, -0.2, 0.5, ...],  # Response 1
  [0.3, 0.1, -0.4, ...], # Response 2
  [...]                   # N responses
])
similarity_matrix: 768 dimensions
processing_time: ~50ms for 3000 rows`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Practical Examples */}
        <div id="examples">
          <GlassCard title={t('dataCollection.examples.title')} className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">{t('dataCollection.examples.heading')}</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {t('dataCollection.examples.intro')}
                </p>
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-cyan-300 font-semibold mb-3">Semantic Dictionary Example</h4>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {t('dataCollection.technical.semanticDictionarySample')}
                    </pre>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-purple-300 font-semibold mb-3">Embeddings Example</h4>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {t('dataCollection.technical.embeddingsSample')}
                    </pre>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg mt-4">
                  <h4 className="text-green-300 font-semibold mb-3">Cosine Similarity</h4>
                  <p className="text-gray-300 text-sm mb-3">{t('dataCollection.technical.cosineSimilarityExplanation')}</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-green-300">
                    {t('dataCollection.technical.cosineSimilarityFormula')}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{t('dataCollection.technical.cosineSimilarityValues')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Search className="w-6 h-6 text-indigo-400 mr-2" />
                    <h4 className="text-indigo-300 font-semibold">{t('dataCollection.examples.smartSearch')}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    {t('dataCollection.examples.smartSearchDescription')}
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>{t('dataCollection.examples.unhappyCustomersSynonyms')}</p>
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="w-6 h-6 text-emerald-400 mr-2" />
                    <h4 className="text-emerald-300 font-semibold">{t('dataCollection.examples.instantAnalysis')}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    {t('dataCollection.examples.instantAnalysisDescription')}
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>{t('dataCollection.examples.automaticAnalysis')}</p>
                  </div>
                </div>

                <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-rose-400 mr-2" />
                    <h4 className="text-rose-300 font-semibold">{t('dataCollection.examples.contextMemory')}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    {t('dataCollection.examples.contextMemoryDescription')}
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>{t('dataCollection.examples.maintainsContext')}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Privacy & Security */}
        <div id="security">
          <GlassCard title={t('dataCollection.security.title')} className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">{t('dataCollection.security.heading')}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t('dataCollection.security.privacyPrinciples')}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Lock className="w-6 h-6 text-blue-400 mr-3" />
                    <h4 className="text-blue-300 font-semibold text-lg">{t('dataCollection.security.dataProcessing')}</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.filesStored')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.completeDatasets')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.noPersonalIdentifiers')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.temporaryProcessing')}
                    </li>
                  </ul>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Shield className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">{t('dataCollection.security.technicalSafeguards')}</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.endToEndEncryption')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.accessControls')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.securityAudits')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('dataCollection.security.gdprCompliance')}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <Info className="w-6 h-6 text-amber-400 mr-3" />
                  <h4 className="text-amber-300 font-semibold text-lg">{t('dataCollection.security.advancedPython')}</h4>
                </div>
                
                {/* Column Processing */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">{t('dataCollection.security.intelligentColumn')}</h5>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-white font-semibold mb-3">{t('dataCollection.security.automaticColumn')}</h6>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>{t('dataCollection.security.headersDetection')}</li>
                        <li>{t('dataCollection.security.dataTypeInference')}</li>
                        <li>{t('dataCollection.security.questionMapping')}</li>
                        <li>{t('dataCollection.security.multiLanguageSupport')}</li>
                        <li>{t('dataCollection.security.demographicExtraction')}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-white font-semibold mb-3">{t('dataCollection.security.advancedStructuring')}</h6>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>{t('dataCollection.security.responseCleaning')}</li>
                        <li>{t('dataCollection.security.semanticEnrichment')}</li>
                        <li>{t('dataCollection.security.crossReferenceBuilding')}</li>
                        <li>{t('dataCollection.security.statisticalPreparation')}</li>
                        <li>{t('dataCollection.security.multiFileHandling')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Vector Search Technology */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">{t('dataCollection.security.vectorSearch')}</h5>
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-4">
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {t('dataCollection.security.vectorSearchDesc')}
                    </p>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-purple-300 font-semibold mb-3">{t('dataCollection.security.embeddingGeneration')}</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.security.embeddingGeneration1')}</li>
                        <li>{t('dataCollection.security.embeddingGeneration2')}</li>
                        <li>{t('dataCollection.security.embeddingGeneration3')}</li>
                        <li>{t('dataCollection.security.embeddingGeneration4')}</li>
                        <li>{t('dataCollection.security.embeddingGeneration5')}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-blue-300 font-semibold mb-3">{t('dataCollection.security.similarityCalculation')}</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.security.similarityCalculation1')}</li>
                        <li>{t('dataCollection.security.similarityCalculation2')}</li>
                        <li>{t('dataCollection.security.similarityCalculation3')}</li>
                        <li>{t('dataCollection.security.similarityCalculation4')}</li>
                        <li>{t('dataCollection.security.similarityCalculation5')}</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-green-300 font-semibold mb-3">{t('dataCollection.security.resultProcessing')}</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>{t('dataCollection.security.resultProcessing1')}</li>
                        <li>{t('dataCollection.security.resultProcessing2')}</li>
                        <li>{t('dataCollection.security.resultProcessing3')}</li>
                        <li>{t('dataCollection.security.resultProcessing4')}</li>
                        <li>{t('dataCollection.security.resultProcessing5')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Data Processing Pipeline */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">{t('dataCollection.security.completePipeline')}</h5>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-4">
                      <h6 className="text-indigo-300 font-semibold mb-2">{t('dataCollection.security.step1')}</h6>
                      <p className="text-sm text-gray-300">{t('dataCollection.security.step1Desc')}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
                      <h6 className="text-purple-300 font-semibold mb-2">{t('dataCollection.security.step2')}</h6>
                      <p className="text-sm text-gray-300">{t('dataCollection.security.step2Desc')}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 border border-pink-500/30 rounded-lg p-4">
                      <h6 className="text-pink-300 font-semibold mb-2">{t('dataCollection.security.step3')}</h6>
                      <p className="text-sm text-gray-300">{t('dataCollection.security.step3Desc')}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 border border-rose-500/30 rounded-lg p-4">
                      <h6 className="text-rose-300 font-semibold mb-2">{t('dataCollection.security.step4')}</h6>
                      <p className="text-sm text-gray-300">{t('dataCollection.security.step4Desc')}</p>
                    </div>
                  </div>
                </div>

                {/* What Gets Processed */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h5 className="text-green-200 font-medium mb-3">{t('dataCollection.security.completeDataset')}</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>{t('dataCollection.security.everyRow')}</li>
                      <li>{t('dataCollection.security.allColumnTypes')}</li>
                      <li>{t('dataCollection.security.multipleFiles')}</li>
                      <li>{t('dataCollection.security.fullContext')}</li>
                      <li>{t('dataCollection.security.richMetadata')}</li>
                      <li>{t('dataCollection.security.noLimitations')}</li>
                    </ul>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h5 className="text-red-200 font-medium mb-3">{t('dataCollection.security.privacySecurity')}</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>{t('dataCollection.security.secureProcessing')}</li>
                      <li>{t('dataCollection.security.noPiiStorage')}</li>
                      <li>{t('dataCollection.security.encryptedVectors')}</li>
                      <li>{t('dataCollection.security.accessControl')}</li>
                      <li>{t('dataCollection.security.compliance')}</li>
                      <li>{t('dataCollection.security.auditTrails')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

  {/* Summary */}
  <GlassCard title={t('dataCollection.summary.title')} className="mb-8">
          <div className="text-center space-y-6">
            <p className="text-xl text-gray-300 leading-relaxed">
              {t('dataCollection.summary.description')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 my-8">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
                <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">{t('dataCollection.summary.startConversation')}</h4>
                <p className="text-gray-300 text-sm">{t('dataCollection.summary.uploadFiles')}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">{t('dataCollection.summary.instantInsights')}</h4>
                <p className="text-gray-300 text-sm">{t('dataCollection.summary.detailedAnalysis')}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-lg p-6">
                <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">{t('dataCollection.summary.exploreDeeper')}</h4>
                <p className="text-gray-300 text-sm">{t('dataCollection.summary.followUp')}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-2">
            {t('dataCollection.footer.disclaimer')}
          </p>
          <p>
            {t('dataCollection.footer.support')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;