import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, AuthContextType } from '@/types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // No admin state, rely on user.role only

  // Login using backend API
  const login = async (email: string, password: string) => {
    try {
      
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }
      if (data.accessToken && data.refreshToken) {
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
        
        // Decode token to get user info
        const decoded: any = jwtDecode(data.accessToken);
        
        // No profile fetch needed - JWT contains all required data
        
        const userRole = decoded.role;
        
        // Use only JWT token data - simple and direct
        const userData = { 
          id: decoded.sub || decoded.id,  // JWT standard uses 'sub' for subject (user ID)
          email: decoded.email,
          role: userRole,
          language_preference: decoded.language || 'en',
          welcome_popup_dismissed: decoded.welcome_popup_dismissed || false
        };
        
        setUser(userData);
        return { success: true, role: userRole };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  // Register using backend API
  const register = async (email: string, username: string, password: string) => {
    try {
      // Register API call
      
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Registration failed' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during registration.' };
    }
  };

  // Google login session handler
  useEffect(() => {
    // Check for JWT in URL after Google OAuth2 redirect
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      // User will be set after profile fetch
      // Remove token from URL
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  // Logout: clear user and remove tokens
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout endpoint to revoke tokens
    try {
      await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  };

  // Function to refresh access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh token');
      }

      if (data.accessToken && data.refreshToken) {
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
        return data.accessToken;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear all auth data on refresh failure
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      throw error;
    }
  };

  // Function to check if token needs refresh (refresh if expires within 5 minutes)
  const shouldRefreshToken = () => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return false;
    
    const expiryTime = parseInt(tokenExpiry);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (expiryTime - now) <= fiveMinutes;
  };

  // Profile fetch removed - using JWT token data only

  // useEffect for session management with backend JWT and automatic refresh
  useEffect(() => {
    const initializeAuth = async () => {
      let token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Check if token needs refresh
          if (shouldRefreshToken()) {
            try {
              token = await refreshAccessToken();
            } catch (refreshError) {
              console.error('Failed to refresh token during initialization:', refreshError);
              setLoading(false);
              return;
            }
          }
          
          const decoded: any = jwtDecode(token);
          
          // Debug: Log decoded token data
          console.log('DEBUG - Token decoded:', { 
            id: decoded.sub || decoded.id, 
            email: decoded.email, 
            role: decoded.role,
            language: decoded.language,
            exp: decoded.exp 
          });
          
          // Check if token is expired
          if (decoded.exp * 1000 <= Date.now()) {
            throw new Error('Token is expired');
          }
          
          // No profile fetch needed - JWT contains all required data
          
          // Use only JWT token data - simple and direct
          const userData = { 
            id: decoded.sub || decoded.id,  // JWT standard uses 'sub' for subject (user ID)
            email: decoded.email,
            role: decoded.role,
            language_preference: decoded.language || 'en',
            welcome_popup_dismissed: decoded.welcome_popup_dismissed || false
          };
          
          setUser(userData);
        } catch (e) {
          setUser(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiry');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []); // Remove user dependency to prevent infinite loop

  // Separate useEffect for periodic token refresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      if (shouldRefreshToken()) {
        refreshAccessToken().catch(error => {
          console.error('Automatic token refresh failed:', error);
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Function to update user data locally
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  // Compute isAdmin based on user role
  const isAdmin = user?.role === 'admin';
  
  // Debug: Detailed role computation
  console.log('🔍 USEAUTH ROLE DEBUG:', { 
    hasUser: !!user,
    userRole: user?.role, 
    userRoleType: typeof user?.role,
    isAdminComputed: isAdmin,
    directCheck: user?.role === 'admin',
    fullUser: user
  });

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      register,
      logout,
      refreshToken: refreshAccessToken,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
