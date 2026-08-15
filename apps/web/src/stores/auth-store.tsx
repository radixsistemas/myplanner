import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { authStorage } from "../lib/auth-storage";
import { useTheme } from "./theme-store";
import type { UserProfile } from "../types/api";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme } = useTheme();

  async function loadUser() {
    if (!authStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<UserProfile>("/users/me");
      setUser(data);
      setTheme(data.theme);
    } catch {
      authStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    authStorage.setTokens(data.accessToken, data.refreshToken);
    await loadUser();
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await api.post("/auth/register", { name, email, password });
    authStorage.setTokens(data.accessToken, data.refreshToken);
    await loadUser();
  }

  async function logout() {
    const refreshToken = authStorage.getRefreshToken();
    authStorage.clear();
    setUser(null);
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // já limpamos localmente; falha no logout remoto não é crítica
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
