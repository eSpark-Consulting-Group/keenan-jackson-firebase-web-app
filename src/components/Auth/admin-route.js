import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authcontext';
import toast from 'react-hot-toast';

export default function AdminRoute({ children }) {
  const { user, userData, loading } = useAuth();
  console.log(userData, "userData", user)

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    toast.error('Please login to access admin area');
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (!userData?.isAdmin) {
    toast.error('You do not have admin privileges');
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and is admin
  return children;
}