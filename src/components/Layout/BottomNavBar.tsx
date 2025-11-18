import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, MapPin } from 'lucide-react';

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/stranger', icon: Compass, label: 'Stranger' },
    { path: '/popups/chat', icon: MessageCircle, label: 'Chats' },
    { path: '/tools', icon: MapPin, label: 'Tools' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
              location.pathname === item.path ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            }`}
          >
            <item.icon size={24} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;
