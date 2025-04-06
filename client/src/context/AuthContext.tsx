import { createContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { LoginUser, RegisterUser, UpdateUser, User } from "@shared/schema";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isUpdating: boolean;
  login: (credentials: LoginUser) => Promise<void>;
  register: (userData: RegisterUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: UpdateUser) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,
  isRegistering: false,
  isUpdating: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isAuthenticated = !!user;

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginUser) => {
    setIsLoggingIn(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (userData: RegisterUser) => {
    setIsRegistering(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await res.json();
      setUser(newUser);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const updateUser = async (userData: UpdateUser) => {
    setIsUpdating(true);
    try {
      const res = await apiRequest("PUT", "/api/users/me", userData);
      const updatedUser = await res.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Update failed:", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isLoggingIn,
        isRegistering,
        isUpdating,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
