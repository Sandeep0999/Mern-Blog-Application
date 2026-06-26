import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const STAFF_ROLES = ['admin', 'moderator', 'content_reviewer', 'support_admin'];
  return user && STAFF_ROLES.includes(user.role) ? children : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;