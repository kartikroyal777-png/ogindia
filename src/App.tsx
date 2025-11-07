import React, { useEffect, Suspense, lazy } from 'react';
    import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import TopNavBar from './components/Layout/TopNavBar';
    import BottomNavBar from './components/Layout/BottomNavBar';
    import { useAuth } from './contexts/AuthContext';
    import FullScreenLoader from './components/Layout/FullScreenLoader';
    import ErrorBoundary from './components/Layout/ErrorBoundary';
    import { AlertTriangle } from 'lucide-react';
    import EditProfileModal from './components/Profile/EditProfileModal';

    // Eager load core pages
    import HomePage from './components/Home/HomePage';
    import StrangerPage from './pages/StrangerPage';
    import CityPopupsPage from './pages/CityPopupsPage';
    import ChatPage from './pages/ChatPage';
    import ToolsPage from './pages/ToolsPage';
    import AuthPage from './pages/AuthPage';
    import ProfilePage from './pages/ProfilePage';
    import ShopPage from './pages/ShopPage';
    import TripPlannerPage from './pages/TripPlanner/TripPlannerPage';

    // Lazy load other pages
    const TravelScannerPage = lazy(() => import('./pages/TravelScannerPage'));
    const CityItineraryPage = lazy(() => import('./pages/CityItineraryPage'));
    const LocationDetailPage = lazy(() => import('./components/Location/LocationDetailPage'));
    const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
    const AdminPage = lazy(() => import('./pages/AdminPage'));
    const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
    const SavedPlacesPage = lazy(() => import('./pages/SavedPlacesPage'));
    const FareCalculatorPage = lazy(() => import('./pages/tools/FareCalculatorPage'));
    const CurrencyExchangerPage = lazy(() => import('./pages/tools/CurrencyExchangerPage'));
    const BudgetTrackerPage = lazy(() => import('./pages/tools/BudgetTrackerPage'));
    const BargainingCoachPage = lazy(() => import('./pages/tools/BargainingCoachPage'));
    const EmergencySOSPage = lazy(() => import('./pages/tools/EmergencySOSPage'));
    const TranslatePage = lazy(() => import('./pages/TranslatePage'));
    const AppSettingsPage = lazy(() => import('./pages/AppSettingsPage'));
    const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
    const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
    const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
    const PricingPage = lazy(() => import('./pages/PricingPage'));
    const UpgradeModal = lazy(() => import('./components/Layout/UpgradeModal'));

    const AppInitError: React.FC<{ message: string }> = ({ message }) => (
      <div className="fixed inset-0 bg-gray-100 z-[100] flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-medium text-gray-800">Application Error</h2>
        <p className="text-gray-600 mt-2">Could not load the application. Please try refreshing the page.</p>
        <p className="text-xs text-gray-500 mt-4 bg-gray-200 p-2 rounded-md font-mono max-w-lg">{message}</p>
      </div>
    );

    const ProtectedRoute: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
      const { session, user, loading } = useAuth();
      const navigate = useNavigate();

      useEffect(() => {
        if (loading) return;
        if (!session) {
          navigate('/auth', { replace: true });
        } else if (adminOnly && user?.email !== 'kartikroyal777@gmail.com') {
          navigate('/', { replace: true });
        }
      }, [session, user, adminOnly, navigate, loading]);

      if (loading) return <FullScreenLoader />;
      if (!session) return null;
      if (adminOnly && user?.email !== 'kartikroyal777@gmail.com') return null;

      return <Outlet />;
    };

    const AppLayout = () => {
      const location = useLocation();
      const { isEditProfileModalOpen, showEditProfileModal } = useAuth();
      const noNavRoutes = ['/auth', '/admin'];
      
      const isFullScreenPage = [
        '/travel-scanner',
        '/pricing',
      ].includes(location.pathname);

      const isSubToolPage = location.pathname.startsWith('/tools/') && location.pathname !== '/tools';

      const showTopNav = !noNavRoutes.some(path => location.pathname.startsWith(path)) && !isFullScreenPage && !isSubToolPage;
      const showBottomNav = !noNavRoutes.some(path => location.pathname.startsWith(path)) && !isFullScreenPage && !isSubToolPage;

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {showTopNav && <TopNavBar />}
          
          <main className={`flex-grow ${showTopNav ? 'pt-16' : ''} ${showBottomNav ? 'pb-20' : ''} flex flex-col`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-grow flex flex-col"
              >
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>

          {showBottomNav && <BottomNavBar />}
          <Suspense fallback={null}><UpgradeModal /></Suspense>
          <AnimatePresence>
            {isEditProfileModalOpen && <EditProfileModal onClose={() => showEditProfileModal(false)} />}
          </AnimatePresence>
        </div>
      );
    };

    function App() {
      const { loading, error } = useAuth();

      if (loading) {
        return <FullScreenLoader />;
      }

      if (error) {
        return <AppInitError message={error} />;
      }
      
      return (
        <ErrorBoundary>
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/travel-scanner" element={<TravelScannerPage />} />

              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/stranger" element={<StrangerPage />} />
                <Route path="/stranger/:cityId" element={<CityPopupsPage />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/chat/:chatId" element={<ChatPage />} />
                  <Route path="/planner" element={<TripPlannerPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/my-trips" element={<MyTripsPage />} />
                  <Route path="/saved-places" element={<SavedPlacesPage />} />
                  <Route path="/settings/app" element={<AppSettingsPage />} />
                  <Route path="/about-us" element={<AboutUsPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                </Route>

                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>

                <Route path="/city/:cityId" element={<CityItineraryPage />} />
                <Route path="/location/:locationId" element={<LocationDetailPage />} />
              </Route>
              
              {/* Tool routes outside main layout for fullscreen/custom layout */}
              <Route path="/tools/translate" element={<TranslatePage />} />
              <Route path="/tools/fare-calculator" element={<FareCalculatorPage />} />
              <Route path="/tools/currency-exchanger" element={<CurrencyExchangerPage />} />
              <Route path="/tools/budget-tracker" element={<BudgetTrackerPage />} />
              <Route path="/tools/bargaining-coach" element={<BargainingCoachPage />} />
              <Route path="/tools/emergency" element={<EmergencySOSPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      );
    }

    export default App;
