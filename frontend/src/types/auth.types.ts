export interface AuthUser {
  username: string;
  userOrgIds: string[];
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  handleLogin: (username: string, password: string) => Promise<void>;
  handleSignup: (username: string, password: string) => Promise<void>;
  handleLogout: () => void;
}
