import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export type PlatformUser = {
  id: number;
  username: string;
  fullName: string;
  age: number;
  specialization: string;
  learningId: string;
  favoriteSection: string;
  role: "student" | "admin" | "super_admin";
};

export function usePlatformAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.platformAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.platformAuth.logout.useMutation({
    onSuccess: () => {
      utils.platformAuth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore
    } finally {
      utils.platformAuth.me.setData(undefined, null);
      await utils.platformAuth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: (meQuery.data as PlatformUser | null) ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
      isAdmin: meQuery.data?.role === "admin" || meQuery.data?.role === "super_admin",
      isSuperAdmin: meQuery.data?.role === "super_admin",
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
