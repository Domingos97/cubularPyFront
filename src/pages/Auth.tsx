import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Sparkles, Users, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';

const Auth = () => {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Google login removed

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const from = location.state?.from?.pathname || '/';

  // Handle email confirmation URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const confirmed = urlParams.get('confirmed');
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (confirmed === 'true' && email) {
      // Auto-fill email and show success message
      setLoginData(prev => ({ ...prev, email: decodeURIComponent(email) }));
      toast({
        title: t('auth.emailConfirmed'),
        description: t('auth.emailConfirmedDesc'),
        variant: "default",
      });
    } else if (error) {
      // Handle confirmation errors
      let errorMessage = t('auth.confirmationError');
      switch (error) {
        case 'invalid_token':
          errorMessage = t('auth.invalidToken');
          break;
        case 'expired_token':
          errorMessage = t('auth.expiredToken');
          break;
        case 'already_confirmed':
          errorMessage = t('auth.alreadyConfirmed');
          break;
        case 'server_error':
          errorMessage = t('auth.serverError');
          break;
      }
      setError(errorMessage);
    }
  }, [location.search, toast]);

  // Redirect after login, waiting for isAdmin to be set
  const navigate = useNavigate();
  // Redirect based on user role
  if (user && user.role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      // Navigate immediately after successful login using the role from the result
      if (result.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      if (result.error?.includes('Email not confirmed')) {
        setError(t('auth.emailNotConfirmed'));
      } else {
        setError(result.error || t('auth.loginFailed'));
      }
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    const result = await register(signupData.email, signupData.username, signupData.password);
    
    if (!result.success) {
      setError(result.error || t('auth.registrationFailed'));
    } else {
      // Show success message for email confirmation
      toast({
        title: t('auth.registrationSuccessful'),
        description: t('auth.registrationSuccessfulDesc'),
        variant: "default",
      });
      setSignupData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setError('');
    }
    
    setIsLoading(false);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0,transparent_70%)]"></div>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('auth.welcomeToCubular')}</h1>
          <p className="text-gray-400">{t('auth.signInDashboard')}</p>
        </div>

        <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-gray-600">
                  {t('auth.signIn')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gray-600">
                  {t('auth.signUp')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl text-white">{t('auth.signInToAccount')}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('auth.enterEmailPassword')}
                  </CardDescription>
                </div>

                {error && (
                  <Alert className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                      {t('form.label.email')}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white"
                      placeholder={t('form.placeholder.email')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-300">
                      {t('form.label.password')}
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white pr-10"
                        placeholder={t('form.placeholder.password')}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </form>
                

              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl text-white">{t('auth.createAccount')}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('auth.signInDashboard')}
                  </CardDescription>
                </div>

                {error && (
                  <Alert className="bg-red-900/50 border-red-700">
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-username" className="text-sm font-medium text-gray-300">
                      {t('form.label.username')}
                    </label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white"
                      placeholder={t('form.placeholder.username')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium text-gray-300">
                      {t('form.label.email')}
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white"
                      placeholder={t('form.placeholder.email')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium text-gray-300">
                      {t('form.label.password')}
                    </label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white pr-10"
                        placeholder={t('form.placeholder.createPassword')}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-gray-300">
                      {t('form.label.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="bg-gray-700 border-gray-600 focus:ring-blue-500 text-white pr-10"
                        placeholder={t('form.placeholder.confirmPassword')}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                  </Button>
                </form>
                

              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Decorative elements */}
        <div className="flex justify-center mt-8 space-x-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full opacity-60"></div>
        </div>
      </div>
    </div>
  );
};

export default Auth;