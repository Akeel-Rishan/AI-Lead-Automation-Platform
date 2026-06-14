"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  getToken,
  getUser,
  logout as logoutSession,
  setUser,
  type StoredUser
} from "@/lib/auth";

export type StoredTenant = {
  id: string;
  name: string;
  plan: string;
  isActive?: boolean;
};

type MeResponse = {
  success: boolean;
  user: StoredUser;
  tenant: StoredTenant;
};

export function useAuth() {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [tenant, setTenant] = useState<StoredTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const token = getToken();
      const storedUser = getUser();

      if (!token) {
        if (isMounted) {
          setUserState(null);
          setTenant(null);
          setIsLoading(false);
        }
        return;
      }

      if (storedUser && isMounted) {
        setUserState(storedUser);
      }

      try {
        const response = await api.get<MeResponse>("/auth/me");

        if (!isMounted) {
          return;
        }

        setUser(response.data.user);
        setUserState(response.data.user);
        setTenant(response.data.tenant);
      } catch {
        if (isMounted) {
          logoutSession();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    tenant,
    isLoading,
    isAuthenticated: Boolean(user && getToken()),
    logout: logoutSession
  };
}
