import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AdminUser extends User {
  isAdmin: boolean;
}

export function useAdminAuth() {
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ["/api/admin/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true,
    error,
  };
}