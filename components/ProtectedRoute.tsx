
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './ui/PageLoader';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = ReactRouterDOM.useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <ReactRouterDOM.Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(user!.role)) {
    // If user is logged in but tries to access a page they don't have permission for,
    // redirect them to their default dashboard.
    const defaultRoute = user!.role === Role.Patient ? '/portal/dashboard' : '/dashboard';
    return <ReactRouterDOM.Navigate to={defaultRoute} replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;