"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api-client";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/token";
import type { AuthUser, CurrentUser, LoginResponse } from "@/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthenticatedUser: (user: AuthUser) => void;
  setSession: (session: LoginResponse) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const shouldClearRestoredSession = (status: number | null) => status === 401;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setIsLoading(false);
  }, []);

  const setSession = useCallback((session: LoginResponse) => {
    setAuthToken(session.token);
    setAuthenticatedUser(session.user);
  }, [setAuthenticatedUser]);

  const clearSession = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setIsLoading(false);
  }, []);

  // Handle unauthorized event dispatched by API client on 401
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener("citycare:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("citycare:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!getAuthToken()) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const result = await apiRequest<CurrentUser>("auth/me");

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        setUser(result.data);
      } else {
        setUser(null);

        if (!result.success && shouldClearRestoredSession(result.status)) {
          clearAuthToken();
        }
      }

      setIsLoading(false);
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      setAuthenticatedUser,
      setSession,
      clearSession,
    }),
    [clearSession, isLoading, setAuthenticatedUser, setSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};
