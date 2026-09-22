import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E5E7EB',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'btn-spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E5E7EB',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'btn-spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/calendar" replace />;
  }

  return <>{children}</>;
};
