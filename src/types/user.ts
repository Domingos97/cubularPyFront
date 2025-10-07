// User types and interfaces

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
  updated_at?: string;
  preferred_personality?: string;
  role_id?: string;
  role?: string; // Simple string role from JWT (e.g., 'admin', 'user')
  role_details?: {
    id: string;
    name: string;
  };
  personality_details?: {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
  };
  welcome_popup_dismissed?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  updateUser: (updates: Partial<User>) => void;
}