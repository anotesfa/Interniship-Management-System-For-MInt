// Custom hook for authentication
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../types';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout, hasRole } = useAuthStore();

  const isAdmin = hasRole(UserRole.ADMIN);
  const isUniversity = hasRole(UserRole.UNIVERSITY);
  const isSupervisor = hasRole(UserRole.SUPERVISOR);
  const isStudent = hasRole(UserRole.STUDENT);

  return {
    user,
    isAuthenticated,
    setUser,
    logout,
    hasRole,
    isAdmin,
    isUniversity,
    isSupervisor,
    isStudent,
  };
};
