// User types and interfaces

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
  updated_at?: string;
  preferred_personality?: string;
  has_ai_personalities_access?: boolean;
  language_preference?: string; // ISO 639-1 with region code (e.g., 'en-US', 'es-ES', 'pt-PT', 'sv-SE')
  role_id?: string;
  role?: string; // Simple string role from JWT (e.g., 'admin', 'user')
  avatar?: string; // optional URL to user's avatar image
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