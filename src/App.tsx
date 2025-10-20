
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { SurveyProvider } from "./contexts/SurveyContext";
import { LanguageProvider } from "./resources/i18n";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UserLanguageSync } from "./components/UserLanguageSync";
import { Suspense, lazy } from "react";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const SurveyDetails = lazy(() => import("./pages/SurveyDetails"));
const AIPersonalityEdit = lazy(() => import("./pages/AIPersonalityEdit"));
const UserAIPersonalityEdit = lazy(() => import("./pages/UserAIPersonalityEdit"));
const UserEdit = lazy(() => import("./pages/UserEdit").then(module => ({ default: module.UserEdit })));
const Personalization = lazy(() => import("./pages/Personalization"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-300 text-sm">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider defaultLanguage="en-US">
      <AuthProvider>
        <UserLanguageSync />
        <SurveyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={
                  <ProtectedRoute>
                    <About />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/survey/:surveyId" element={
                  <ProtectedRoute adminOnly>
                    <SurveyDetails />
                  </ProtectedRoute>
                } />
                <Route path="/admin/personalities/:id/edit" element={
                  <ProtectedRoute adminOnly>
                    <AIPersonalityEdit />
                  </ProtectedRoute>
                } />
                <Route path="/admin/personalities/new" element={
                  <ProtectedRoute adminOnly>
                    <AIPersonalityEdit />
                  </ProtectedRoute>
                } />
                  <Route path="/personalization/personalities/:id/edit" element={
                    <ProtectedRoute>
                      <UserAIPersonalityEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/personalization/personalities/new" element={
                    <ProtectedRoute>
                      <UserAIPersonalityEdit />
                    </ProtectedRoute>
                  } />
                <Route path="/admin/users/:userId/edit" element={
                  <ProtectedRoute adminOnly>
                    <UserEdit />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
                <Route path="/contact" element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                } />
                <Route path="/personalization" element={
                  <ProtectedRoute>
                    <Personalization />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </TooltipProvider>
      </SurveyProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
