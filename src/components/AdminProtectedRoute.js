import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const userType = sessionStorage.getItem('userType');
  
  if (userType !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};

export default AdminProtectedRoute; 