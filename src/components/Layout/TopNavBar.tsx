import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, LogIn, LogOut, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const TopNavBar = () => {
  const { session, isAdmin } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Logout failed: ' + error.message);
    } else {
      toast.success('Logged out successfully!');
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-orange-500">
            Wander
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-orange-100" title="Admin">
                    <Shield size={22} />
                  </Link>
                )}
                <Link to="/profile" className="text-gray-600 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-orange-100" title="Profile">
                  <UserCircle size={24} />
                </Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-100" title="Logout">
                  <LogOut size={22} />
                </button>
              </>
            ) : (
              <Link to="/auth" className="flex items-center gap-2 text-gray-600 font-semibold hover:text-orange-500 transition-colors">
                <LogIn size={20} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;
