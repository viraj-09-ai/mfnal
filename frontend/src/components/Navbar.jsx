import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-900 text-white px-6 py-3 flex flex-wrap justify-between items-center gap-3">
      <div className="flex flex-wrap gap-5 items-center">
        <span className="font-bold text-lg">Visitor Management</span>
        {(user.role === 'Admin' || user.role === 'Security') && (
          <Link to="/" className="hover:underline">Dashboard</Link>
        )}
        {(user.role === 'Admin' || user.role === 'Employee') && (
          <Link to="/register" className="hover:underline">Register Visitor</Link>
        )}
        {(user.role === 'Admin' || user.role === 'Security') && (
          <Link to="/scan" className="hover:underline">Scan Pass</Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-90">{user.name} &middot; {user.role}</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
