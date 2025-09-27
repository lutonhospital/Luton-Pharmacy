import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export function useAuth() {
  // Check regular user authentication
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check admin authentication
  const { data: adminUser, isLoading: adminLoading } = useQuery<AdminUser>({
    queryKey: ["/api/admin/auth/user"],
    retry: false,
  });

  // Combine the results - admin auth takes precedence
  const combinedUser = adminUser || user;
  const isLoading = userLoading || adminLoading;
  const isAuthenticated = !!(adminUser || user);

  return {
    user: combinedUser,
    isLoading,
    isAuthenticated,
    isAdmin: adminUser?.isAdmin || false,
  };
}
