import React from 'react';
import { 
  MessageCircle, 
  Brain, 
  Zap, 
  Target, 
  Upload, 
  Search,
  BarChart3,
  Users,
  Check,
  ArrowRight,
  Info,
  Shield,
  Lock
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const DataCollection: React.FC = () => {
  return (
    <div className="min-h-screen gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            How AI Chat Analyzes Survey Data
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how artificial intelligence transforms survey data into conversational insights, 
            making complex analysis as simple as asking a question.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <a href="#overview" className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center hover:bg-blue-900/30 transition-colors">
            <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-white font-medium">Overview</span>
          </a>
          <a href="#processing" className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center hover:bg-purple-900/30 transition-colors">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <span className="text-white font-medium">AI Pipeline</span>
          </a>
          <a href="#examples" className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center hover:bg-green-900/30 transition-colors">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <span className="text-white font-medium">Examples</span>
          </a>
          <a href="#security" className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 text-center hover:bg-orange-900/30 transition-colors">
            <Shield className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <span className="text-white font-medium">Privacy</span>
          </a>
        </div>

        {/* Chat System Overview */}
        <div id="overview">
          <GlassCard title="🤖 How AI Chat Works with Survey Data" className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">Intelligent Survey Analysis Through Conversation</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  The AI chat system transforms how you interact with survey data. Instead of manually searching through spreadsheets or running complex queries, 
                  simply ask questions in natural language. The AI understands the intent, searches through available survey files, and provides precise, 
                  contextual answers with supporting data.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">Simple & Natural</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      Ask questions like "What do customers think about pricing?"
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      Get instant answers with relevant data points
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      No need to understand database queries or Excel formulas
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      Ask follow-up questions for deeper insights
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className="text-purple-300 font-semibold text-lg">Behind the Scenes</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      AI processes survey files into searchable vectors
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      Semantic search finds relevant data across all files
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      Context-aware responses using advanced language models
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      Real-time analysis of patterns and correlations
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* AI Processing Pipeline */}
        <div id="processing">
          <GlassCard title="🧠 AI Processing Pipeline" className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">From Raw Data to Intelligent Conversations</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  When survey files are uploaded, the AI system processes them through a sophisticated pipeline that transforms raw data into 
                  searchable, contextual information. This process makes survey data instantly accessible through natural language conversations.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="w-6 h-6 text-blue-400 mr-3" />
                    <h4 className="text-blue-300 font-semibold text-lg">1. Data Ingestion</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      CSV and Excel files are parsed and validated to ensure data quality and structure integrity.
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-blue-200 font-medium text-sm mb-2">Processing Steps:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• File format validation</li>
                        <li>• Character encoding detection</li>
                        <li>• Column structure analysis</li>
                        <li>• Data type inference</li>
                        <li>• Missing value handling</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className="text-purple-300 font-semibold text-lg">2. Vectorization</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      Data is converted into high-dimensional vectors that capture semantic meaning and relationships.
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-purple-200 font-medium text-sm mb-2">AI Techniques:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Embedding generation</li>
                        <li>• Semantic similarity mapping</li>
                        <li>• Context window optimization</li>
                        <li>• Vector database indexing</li>
                        <li>• Similarity search preparation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">3. Query Processing</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      Questions are analyzed to find the most relevant data points and generate accurate responses.
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <h5 className="text-green-200 font-medium text-sm mb-2">Response Generation:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Intent understanding</li>
                        <li>• Semantic search execution</li>
                        <li>• Context retrieval</li>
                        <li>• LLM response synthesis</li>
                        <li>• Fact verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-900/20 to-red-900/20 border border-amber-500/30 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Target className="w-6 h-6 text-amber-400 mr-3" />
                  <h3 className="text-amber-300 font-semibold text-xl">Real-Time Intelligence</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Every conversation maintains context and learns from questions. The AI remembers previous discussions 
                  within the session, allowing for natural follow-up questions and deeper analysis. For example, if you ask 
                  about customer satisfaction, you can then ask "What about age groups?" and the AI will understand the context.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Technical Deep Dive */}
        <GlassCard title="🔬 Technical Deep Dive: How Python Search Actually Works" className="mb-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="text-white font-semibold text-xl mb-4">Under the Hood: Vector Mathematics & Search Algorithms</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                When you ask a question, the system performs sophisticated mathematical operations to find the most relevant responses 
                across potentially thousands of survey entries. Here's exactly how it works at a technical level.
              </p>
            </div>

            {/* Search Flow */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
                <h4 className="text-emerald-300 font-semibold text-lg mb-4">🎯 Query Processing Flow</h4>
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
                <h4 className="text-teal-300 font-semibold text-lg mb-4">⚡ Performance Optimizations</h4>
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
              <h4 className="text-violet-300 font-semibold text-lg mb-4">📐 Mathematical Foundation</h4>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">Cosine Similarity</h5>
                  <p className="text-gray-300 text-sm mb-3">Measures angle between vectors to find semantic similarity:</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-green-300">
                    similarity = dot(A,B) / (||A|| * ||B||)
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Values range from -1 to 1, with higher values indicating more similarity</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">Vector Embeddings</h5>
                  <p className="text-gray-300 text-sm mb-3">Transform text into mathematical representations:</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-blue-300">
                    "good service" → [0.2, -0.1, 0.8, ...]
                  </div>
                  <p className="text-gray-400 text-xs mt-2">768 dimensions capture semantic relationships and context</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h5 className="text-white font-semibold mb-3">Threshold Filtering</h5>
                  <p className="text-gray-300 text-sm mb-3">Configurable similarity cutoff for relevance:</p>
                  <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-yellow-300">
                    if similarity &gt;= 0.25: include
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Lower thresholds find more results, higher thresholds are more precise</p>
                </div>
              </div>
            </div>

            {/* Data Structure Explanation */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-6">
              <h4 className="text-cyan-300 font-semibold text-lg mb-4">🗄️ Data Structure & Storage</h4>
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-white font-semibold mb-3">Semantic Dictionary Structure</h5>
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
                  <h5 className="text-white font-semibold mb-3">Vector Database Format</h5>
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
          <GlassCard title="💬 See It In Action" className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">Example Conversations</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Here are real examples of how to interact with survey data through the AI chat system. 
                  Notice how natural and conversational the process is.
                </p>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
                      <h4 className="text-cyan-300 font-semibold">Customer Satisfaction Analysis</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="bg-blue-900/30 border-l-4 border-blue-400 p-3 rounded-r">
                        <p className="text-blue-200 font-medium">You ask:</p>
                        <p className="text-gray-300">"What do customers think about our pricing?"</p>
                      </div>
                      <div className="bg-green-900/30 border-l-4 border-green-400 p-3 rounded-r">
                        <p className="text-green-200 font-medium">AI responds:</p>
                        <p className="text-gray-300">"Based on 247 responses, 68% find pricing reasonable, with main concerns being subscription costs (mentioned 34 times) and comparison to competitors (19 mentions)..."</p>
                      </div>
                      <div className="bg-blue-900/30 border-l-4 border-blue-400 p-3 rounded-r">
                        <p className="text-blue-200 font-medium">Follow-up:</p>
                        <p className="text-gray-300">"Which age groups are most concerned about pricing?"</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <Target className="w-5 h-5 text-purple-400 mr-2" />
                      <h4 className="text-purple-300 font-semibold">Product Feature Analysis</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="bg-blue-900/30 border-l-4 border-blue-400 p-3 rounded-r">
                        <p className="text-blue-200 font-medium">You ask:</p>
                        <p className="text-gray-300">"What features do users want most?"</p>
                      </div>
                      <div className="bg-green-900/30 border-l-4 border-green-400 p-3 rounded-r">
                        <p className="text-green-200 font-medium">AI responds:</p>
                        <p className="text-gray-300">"Top requested features: Dark mode (89 mentions), Mobile app (67 mentions), Integration with Slack (45 mentions)..."</p>
                      </div>
                      <div className="bg-blue-900/30 border-l-4 border-blue-400 p-3 rounded-r">
                        <p className="text-blue-200 font-medium">Follow-up:</p>
                        <p className="text-gray-300">"Show me specific feedback about the mobile app requests"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Search className="w-6 h-6 text-indigo-400 mr-2" />
                    <h4 className="text-indigo-300 font-semibold">Smart Search</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Ask questions using natural language. The AI understands context, synonyms, and implied meanings.
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>"unhappy customers" = "dissatisfied", "negative feedback", "complaints"</p>
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="w-6 h-6 text-emerald-400 mr-2" />
                    <h4 className="text-emerald-300 font-semibold">Instant Analysis</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Get statistical breakdowns, correlations, and trends without writing complex queries.
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>Automatic percentages, demographics, sentiment analysis</p>
                  </div>
                </div>

                <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-5">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-rose-400 mr-2" />
                    <h4 className="text-rose-300 font-semibold">Context Memory</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Each conversation remembers previous questions, allowing for natural follow-ups and deeper exploration.
                  </p>
                  <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                    <p>Maintains context throughout the session</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Privacy & Security */}
        <div id="security">
          <GlassCard title="🔐 Privacy & Data Security" className="mb-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg p-6">
                <h3 className="text-white font-semibold text-xl mb-4">Data Privacy is a Priority</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Survey data is sensitive. The AI chat system is designed with privacy-first principles, 
                  ensuring data remains secure while providing powerful analysis capabilities.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Lock className="w-6 h-6 text-blue-400 mr-3" />
                    <h4 className="text-blue-300 font-semibold text-lg">Data Processing</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      Files stored securely in a private database
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      AI processes complete survey datasets for comprehensive analysis
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      No personal identifiers sent to AI models
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      Temporary processing only - no data retention
                    </li>
                  </ul>
                </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Shield className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className="text-green-300 font-semibold text-lg">Technical Safeguards</h4>
                  </div>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      End-to-end encryption for all data transmission
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      Access controls and user authentication
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      Regular security audits and updates
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      GDPR and privacy regulation compliance
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <Info className="w-6 h-6 text-amber-400 mr-3" />
                  <h4 className="text-amber-300 font-semibold text-lg">Advanced Python Backend: File Processing & Search Architecture</h4>
                </div>
                
                {/* Column Processing */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">🔍 Intelligent Column Identification & Processing</h5>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-white font-semibold mb-3">Automatic Column Recognition</h6>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>• <strong>Headers Detection:</strong> Automatically identifies column names, questions, and metadata rows</li>
                        <li>• <strong>Data Type Inference:</strong> Distinguishes text responses, numeric ratings, categorical data, and timestamps</li>
                        <li>• <strong>Question Mapping:</strong> Links survey questions to response columns for contextual understanding</li>
                        <li>• <strong>Multi-language Support:</strong> Processes surveys in different languages with proper encoding</li>
                        <li>• <strong>Demographic Extraction:</strong> Identifies age, gender, location, and other demographic columns</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-white font-semibold mb-3">Advanced Data Structuring</h6>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li>• <strong>Response Cleaning:</strong> Removes duplicates, handles missing values, standardizes formats</li>
                        <li>• <strong>Semantic Enrichment:</strong> Creates contextual metadata for each response</li>
                        <li>• <strong>Cross-Reference Building:</strong> Links related columns and responses across files</li>
                        <li>• <strong>Statistical Preparation:</strong> Pre-calculates distributions, percentages, and correlations</li>
                        <li>• <strong>Multi-File Handling:</strong> Combines data from multiple survey files while preserving structure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Vector Search Technology */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">⚡ High-Performance Vector Search Engine</h5>
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-4">
                    <p className="text-gray-300 leading-relaxed mb-4">
                      The Python backend uses advanced vector mathematics and machine learning to transform survey responses into 
                      searchable mathematical representations. This enables semantic understanding beyond simple keyword matching.
                    </p>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-purple-300 font-semibold mb-3">1. Embedding Generation</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Converts text into high-dimensional vectors (768+ dimensions)</li>
                        <li>• Captures semantic meaning and context</li>
                        <li>• Handles synonyms and related concepts</li>
                        <li>• Preserves linguistic relationships</li>
                        <li>• Creates searchable vector database</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-blue-300 font-semibold mb-3">2. Similarity Calculation</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Uses cosine similarity for vector comparison</li>
                        <li>• Optimized with NumPy vectorization</li>
                        <li>• Processes thousands of responses in milliseconds</li>
                        <li>• Applies dynamic similarity thresholds</li>
                        <li>• Ranks results by relevance scores</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                      <h6 className="text-green-300 font-semibold mb-3">3. Result Processing</h6>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Filters by configurable similarity thresholds</li>
                        <li>• Handles massive datasets (10,000+ results)</li>
                        <li>• Preserves original text and metadata</li>
                        <li>• Links responses to demographic data</li>
                        <li>• Generates contextual snapshots for AI</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Data Processing Pipeline */}
                <div className="mb-8">
                  <h5 className="text-amber-200 font-medium mb-4 text-xl">🔧 Complete Data Processing Pipeline</h5>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-4">
                      <h6 className="text-indigo-300 font-semibold mb-2">Step 1: File Ingestion & Validation</h6>
                      <p className="text-sm text-gray-300">CSV/Excel files are parsed with automatic encoding detection, column structure analysis, and data quality validation.</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
                      <h6 className="text-purple-300 font-semibold mb-2">Step 2: Semantic Dictionary Creation</h6>
                      <p className="text-sm text-gray-300">Each response is processed into a semantic dictionary containing cleaned text, metadata, demographics, and contextual information.</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 border border-pink-500/30 rounded-lg p-4">
                      <h6 className="text-pink-300 font-semibold mb-2">Step 3: Vector Database Construction</h6>
                      <p className="text-sm text-gray-300">High-dimensional embeddings are generated and stored in optimized NumPy arrays for ultra-fast similarity calculations.</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 border border-rose-500/30 rounded-lg p-4">
                      <h6 className="text-rose-300 font-semibold mb-2">Step 4: Real-time Search Optimization</h6>
                      <p className="text-sm text-gray-300">Vectorized operations process thousands of responses simultaneously, returning ranked results with demographic correlations.</p>
                    </div>
                  </div>
                </div>

                {/* What Gets Processed */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h5 className="text-green-200 font-medium mb-3">📊 Complete Dataset Processing:</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Every Single Row:</strong> Complete survey datasets (1000s-3000s of responses)</li>
                      <li>• <strong>All Column Types:</strong> Text, numeric, categorical, demographic data</li>
                      <li>• <strong>Multiple Files:</strong> Cross-survey analysis and correlations</li>
                      <li>• <strong>Full Context:</strong> Question-response relationships preserved</li>
                      <li>• <strong>Rich Metadata:</strong> Timestamps, demographics, response patterns</li>
                      <li>• <strong>No Limitations:</strong> Handles massive datasets without artificial caps</li>
                    </ul>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h5 className="text-red-200 font-medium mb-3">🔒 Privacy & Security:</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>Secure Processing:</strong> Data processed in isolated environments</li>
                      <li>• <strong>No PII Storage:</strong> Personal identifying information filtered out</li>
                      <li>• <strong>Encrypted Vectors:</strong> Mathematical representations, not raw text</li>
                      <li>• <strong>Access Control:</strong> User-specific data isolation</li>
                      <li>• <strong>Compliance:</strong> GDPR and privacy regulation adherence</li>
                      <li>• <strong>Audit Trails:</strong> Complete processing logs for transparency</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Summary */}
        <GlassCard title="🚀 Ready to Experience AI-Powered Survey Analysis?" className="mb-8">
          <div className="text-center space-y-6">
            <p className="text-xl text-gray-300 leading-relaxed">
              Transform survey data from static spreadsheets into dynamic, conversational insights. 
              The AI chat system makes complex data analysis accessible to everyone, regardless of technical expertise.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 my-8">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
                <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">Start a Conversation</h4>
                <p className="text-gray-300 text-sm">Upload survey files and begin asking questions in natural language</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">Get Instant Insights</h4>
                <p className="text-gray-300 text-sm">Receive detailed analysis with supporting data and contextual explanations</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-lg p-6">
                <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">Explore Deeper</h4>
                <p className="text-gray-300 text-sm">Ask follow-up questions and discover patterns you might have missed</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/surveys" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Upload a Survey
              </a>
              <a 
                href="/chat" 
                className="bg-gray-700/50 border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600/50 transition-all duration-200"
              >
                Try the Chat System
              </a>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-2">
            This explanation covers the AI chat analysis system as of November 2024.
          </p>
          <p>
            For questions or technical support, contact the team through the help section.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataCollection;