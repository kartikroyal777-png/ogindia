import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Scan, Wrench, ShoppingBag, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const NavItem: React.FC<{ path: string; label: string; icon: React.ElementType }> = ({ path, label, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(path);

  return (
    <NavLink
      to={path}
      className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-colors h-16"
    >
      <div className={`p-1 rounded-full ${isActive ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-xs mt-1 text-center font-medium ${
        isActive ? 'text-orange-500' : 'text-gray-500'
      }`}>
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -bottom-2 w-1.5 h-1.5 bg-orange-500 rounded-full"
        />
      )}
    </NavLink>
  );
};

const BottomNavBar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/stranger', label: 'Stranger', icon: Users },
    { path: '/tools', label: 'Tools', icon: Wrench },
    { path: '/shop', label: 'Shop', icon: ShoppingBag },
  ];

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 h-20 px-2 z-40"
    >
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        <NavItem {...navItems[0]} />
        <NavItem {...navItems[1]} />

        <div className="flex-shrink-0">
          <NavLink to="/travel-scanner">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="-mt-8 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-300 border-4 border-white"
            >
              <Scan className="w-7 h-7 text-white" />
            </motion.div>
          </NavLink>
        </div>

        <NavItem {...navItems[2]} />
        <NavItem {...navItems[3]} />
      </div>
    </motion.nav>
  );
};

export default BottomNavBar;
