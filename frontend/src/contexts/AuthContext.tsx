import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, getUser, login, logout, signup } from "../lib/auth";
import { useOrganizationStore } from "@/hooks/use-organization";
import type { AuthContextType, AuthUser } from "@/types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
      setCurrentOrganization(user?.userOrgIds[0] || null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute =
      location.pathname === "/login" ||
      location.pathname === "/" ||
      location.pathname === "/signup";

    if (!isAuthenticated && !isPublicRoute) {
      navigate("/login");
    } else if (isAuthenticated && location.pathname === "/login") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);

  const handleLogin = async (username: string, password: string) => {
    const data = await login(username, password);

    setIsAuthenticated(true);
    setUser({ username, userOrgIds: data.user_org_ids });
  };

  const handleSignup = async (username: string, password: string) => {
    await signup(username, password);

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        handleLogin,
        handleSignup,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// const { isAuthenticated, user, handleLogin, handleLogout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
