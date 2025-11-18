import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './components/Home/HomePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import StrangerPage from './pages/StrangerPage';
import CityPopupsPage from './pages/CityPopupsPage';
import ChatPage from './pages/ChatPage';
import TopNavBar from './components/Layout/TopNavBar';
import BottomNavBar from './components/Layout/BottomNavBar';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import CityItineraryPage from './pages/CityItineraryPage';
import ToolsPage from './pages/ToolsPage';

function App() {
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <TopNavBar />
      <main className="flex-grow pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/stranger" element={<ProtectedRoute><StrangerPage /></ProtectedRoute>} />
          <Route path="/city/:cityId/popups" element={<ProtectedRoute><CityPopupsPage /></ProtectedRoute>} />
          <Route path="/popups/chat/:groupId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/city/:cityId/itinerary" element={<CityItineraryPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true} isAdmin={isAdmin}>
              <AdminPage />
            </ProtectedRoute>
          } />

          {/* Add other routes here */}
        </Routes>
      </main>
      <BottomNavBar />
    </div>
  );
}

export default App;
