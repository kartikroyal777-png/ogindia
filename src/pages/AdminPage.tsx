import { useState } from 'react';
import { Shield, Bell, Map, BookOpen, Users, Building, MessageSquare } from 'lucide-react';
import NotificationManager from '../components/Admin/NotificationManager';
import ContentManager from '../components/Admin/ContentManager';
import DictionaryManager from '../components/Admin/DictionaryManager';
import PriceGuideManager from '../components/Admin/PriceGuideManager';
import StrangerCityManager from '../components/Admin/StrangerCityManager';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('strangerCities');

  const tabs = {
    strangerCities: {
      label: 'Stranger Cities',
      icon: Users,
      component: <StrangerCityManager />,
    },
    notifications: {
      label: 'Notifications',
      icon: Bell,
      component: <NotificationManager />,
    },
    content: {
      label: 'Content Manager',
      icon: Map,
      component: <ContentManager />,
    },
    dictionary: {
      label: 'Dictionary',
      icon: BookOpen,
      component: <DictionaryManager />,
    },
    priceGuide: {
        label: 'Price Guide',
        icon: Building,
        component: <PriceGuideManager />,
    },
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left ${
        activeTab === id
          ? 'bg-orange-500 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 flex items-center">
            <Shield className="mr-3 h-10 w-10 text-orange-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your application content and settings.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/4 lg:w-1/5">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              {Object.entries(tabs).map(([id, { label, icon }]) => (
                <TabButton key={id} id={id} label={label} icon={icon} />
              ))}
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 min-h-[60vh]">
              {tabs[activeTab as keyof typeof tabs].component}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
