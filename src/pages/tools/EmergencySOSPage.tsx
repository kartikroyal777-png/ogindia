import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Shield, Siren, Ambulance, Flame, MessageSquare, Globe, Navigation, Copy, User, CheckCircle, XCircle, TrainFront } from 'lucide-react';

const emergencyNumbers = [
  { id: 'police', label: 'Tourist Police', number: '1363', icon: Shield },
  { id: 'national', label: 'National Emergency', number: '112', icon: Phone },
  { id: 'ambulance', label: 'Ambulance', number: '108', icon: Ambulance },
  { id: 'fire', label: 'Fire', number: '101', icon: Flame },
  { id: 'women', label: 'Women Helpline', number: '181', icon: User },
  { id: 'railway', label: 'Railway Helpline', number: '139', icon: TrainFront },
];

const embassies = [
    { name: 'U.S. Embassy, New Delhi', phone: '+91-11-2419-8000' },
    { name: 'British High Commission, New Delhi', phone: '+91-11-2419-2100' },
    { name: 'Australian High Commission', phone: '+91-11-4909-6000' },
];

const EmergencySOSPage: React.FC = () => {
  const [confirmingCall, setConfirmingCall] = useState<{ label: string; number: string } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  const handleCall = (label: string, number: string) => {
    setConfirmingCall({ label, number });
  };

  const executeCall = () => {
    if (confirmingCall) {
      window.open(`tel:${confirmingCall.number}`);
    }
    setConfirmingCall(null);
  };

  const handleShareLocation = () => {
    setIsSharing(true);
    setShareStatus('Getting location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
          const message = `EMERGENCY: I need help. My current location is: ${mapLink}`;
          
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'Emergency Location',
                text: message,
              });
              setShareStatus('Location shared!');
            } catch (error) {
              setShareStatus('Sharing cancelled.');
            }
          } else {
            navigator.clipboard.writeText(message);
            setShareStatus('Location link copied to clipboard!');
          }
          setIsSharing(false);
        },
        () => {
          setShareStatus('Could not get location. Please enable GPS.');
          setIsSharing(false);
        }
      );
    } else {
      setShareStatus('Geolocation is not supported by your browser.');
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center space-x-4">
        <Link to="/tools" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <h1 className="text-xl font-medium text-gray-900">Emergency SOS</h1>
      </div>

      <div className="p-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
          {emergencyNumbers.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button key={item.id} onClick={() => handleCall(item.label, item.number)} className="bg-white rounded-2xl p-4 text-center shadow-sm border hover:border-orange-400 transition-colors">
                <Icon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-medium text-gray-800">{item.label}</p>
                <p className="text-sm text-gray-500">{item.number}</p>
              </motion.button>
            );
          })}
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <button onClick={handleShareLocation} disabled={isSharing} className="w-full bg-blue-500 text-white font-medium rounded-2xl p-4 shadow-md flex items-center justify-center space-x-3 disabled:opacity-70">
                <Navigation className="w-6 h-6" />
                <span>{isSharing ? shareStatus : 'Share Live Location'}</span>
            </button>
             <button className="w-full bg-red-600 text-white font-medium rounded-2xl p-4 shadow-lg flex items-center justify-center space-x-3">
                <Siren className="w-6 h-6" />
                <span>Panic Alarm (Long Press)</span>
            </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <h3 className="font-medium text-lg mb-3 flex items-center space-x-2"><Globe className="w-5 h-5 text-gray-600"/><span>Embassy Quick Connect</span></h3>
            <div className="space-y-2">
                {embassies.map(embassy => (
                    <div key={embassy.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-800">{embassy.name}</p>
                        <button onClick={() => handleCall(embassy.name, embassy.phone)} className="p-2 text-orange-500 rounded-full hover:bg-orange-100"><Phone className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
        </motion.div>
      </div>

      {confirmingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 text-center max-w-sm w-full">
            <h2 className="text-lg font-medium">Confirm Call</h2>
            <p className="text-gray-600 my-2">You are about to call <span className="font-semibold">{confirmingCall.label}</span> at <span className="font-semibold">{confirmingCall.number}</span>.</p>
            <div className="flex space-x-4 mt-6">
              <button onClick={() => setConfirmingCall(null)} className="w-full py-2 bg-gray-200 rounded-lg flex items-center justify-center space-x-2"><XCircle className="w-5 h-5"/><span>Cancel</span></button>
              <button onClick={executeCall} className="w-full py-2 bg-green-500 text-white rounded-lg flex items-center justify-center space-x-2"><CheckCircle className="w-5 h-5"/><span>Call</span></button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmergencySOSPage;
