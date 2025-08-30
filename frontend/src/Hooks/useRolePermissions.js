// src/hooks/useRolePermissions.js
import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS, USER_ROLES } from '../utils/constants';

export const useRolePermissions = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!user?.role) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Get user's role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole(USER_ROLES.ADMIN);
  };

  // Check if user is customer
  const isCustomer = () => {
    return hasRole(USER_ROLES.CUSTOMER);
  };

  // Check if user is mechanic
  const isMechanic = () => {
    return hasRole(USER_ROLES.MECHANIC);
  };

  // Get user's permissions
  const getUserPermissions = () => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  };

  // Check if user can access a specific route based on role
  const canAccessRoute = (allowedRoles) => {
    if (!user?.role) return false;
    return allowedRoles.includes(user.role);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    isAdmin,
    isCustomer,
    isMechanic,
    getUserPermissions,
    canAccessRoute,
    // Re-export from useAuth for convenience
    hasRole,
    hasAnyRole
  };
};