

import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './ui/PageLoader';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(user!.role)) {
    // If user is logged in but tries to access a page they don't have permission for,
    // redirect them to their default dashboard.
    const defaultRoute = user!.role === Role.Patient ? '/portal/dashboard' : '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;
