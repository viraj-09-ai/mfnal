import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap a page with this to require login, and optionally restrict it to
// a set of roles (e.g. <ProtectedRoute roles={['Admin','Security']}>).
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You don't have permission to view this page ({user.role} role).
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
