import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { City, Day, Location } from '../../types';
import { PlusCircle, Edit, Trash2, RefreshCw, ChevronRight, Home, Loader2, WifiOff } from 'lucide-react';
import CityForm from './CityForm';
import DayForm from './DayForm';
import LocationForm from './LocationForm';

type View = 'cities' | 'days' | 'locations';
type FormState = {
  type: View | null;
  mode: 'add' | 'edit';
  data: City | Day | Location | null;
};

const ContentManager: React.FC = () => {
  const [view, setView] = useState<View>('cities');
  const [items, setItems] = useState<(City | Day | Location)[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [formState, setFormState] = useState<FormState>({ type: null, mode: 'add', data: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFormState({ type: null, mode: 'add', data: null });

    let query;
    try {
      if (view === 'locations' && selectedDay?.id) {
        query = supabase.from('locations').select('*, images:location_images(*)').eq('day_id', selectedDay.id);
      } else if (view === 'days' && selectedCity?.id) {
        query = supabase.from('days').select('*').eq('city_id', selectedCity.id).order('day_number');
      } else {
        query = supabase.from('cities').select('*, city_categories(categories(*))').order('name');
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setItems(data as any[] ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [view, selectedCity, selectedDay]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDrillDown = (item: City | Day) => {
    if ('state' in item) { // It's a City
      setSelectedCity(item);
      setView('days');
    } else { // It's a Day
      setSelectedDay(item);
      setView('locations');
    }
  };

  const handleBreadcrumbClick = (targetView: View) => {
    if (targetView === 'cities') {
      setSelectedCity(null);
      setSelectedDay(null);
    }
    if (targetView === 'days') {
      setSelectedDay(null);
    }
    setView(targetView);
  };

  const handleAdd = () => {
    setFormState({ type: view, mode: 'add', data: null });
  };

  const handleEdit = (item: City | Day | Location) => {
    setFormState({ type: view, mode: 'edit', data: item });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setLoading(true);
      const { error: deleteError } = await supabase.from(view).delete().eq('id', id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        fetchData();
      }
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (!formState.type) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Edit className="w-16 h-16 mb-4" />
          <p>Select an item to edit or</p>
          <p>click "Add New" to create one.</p>
        </div>
      );
    }

    const onSave = () => {
      setFormState({ type: null, mode: 'add', data: null });
      fetchData();
    };

    switch (formState.type) {
      case 'cities':
        return <CityForm city={formState.mode === 'edit' ? formState.data as City : null} onSave={onSave} />;
      case 'days':
        if (!selectedCity) return <div className="p-4 text-center text-gray-500">Please select a city first.</div>;
        return <DayForm day={formState.mode === 'edit' ? formState.data as Day : null} cityId={selectedCity.id} onSave={onSave} />;
      case 'locations':
        if (!selectedDay) return <div className="p-4 text-center text-gray-500">Please select a day first.</div>;
        return <LocationForm location={formState.mode === 'edit' ? formState.data as Location : null} dayId={selectedDay.id} onSave={onSave} />;
      default:
        return null;
    }
  };
  
  const getItemName = (item: any) => {
    if (!item) return 'Loading...';
    if (view === 'days') return `Day ${item.day_number || 'N/A'}: ${item.title || 'Untitled'}`;
    return item.name || 'Unnamed Item';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Home onClick={() => handleBreadcrumbClick('cities')} className="w-4 h-4 mr-2 cursor-pointer hover:text-orange-500" />
            {selectedCity && <><ChevronRight className="w-4 h-4" /><span onClick={() => handleBreadcrumbClick('days')} className="cursor-pointer hover:text-orange-500">{selectedCity.name}</span></>}
            {selectedDay && <><ChevronRight className="w-4 h-4" /><span className="text-gray-700 font-medium">Day {selectedDay.day_number}</span></>}
          </div>
          <div className="flex space-x-2">
            <button onClick={fetchData} disabled={loading} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={handleAdd} className="flex items-center space-x-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div> : error ? <div className="text-center py-12 text-red-500 flex flex-col items-center"><WifiOff className="w-12 h-12 mb-4 text-red-400" /><h3 className="text-lg font-semibold">Could not load data</h3><p className="text-sm max-w-sm">{error}</p></div> : (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className={`p-2 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${formState.data?.id === item.id ? 'bg-orange-100' : 'hover:bg-gray-50'}`}>
                <span onClick={() => handleEdit(item)} className="flex-grow font-medium text-gray-800">{getItemName(item)}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                  {view !== 'locations' && <button onClick={() => handleDrillDown(item as City | Day)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>}
                </div>
              </li>
            ))}
             {items.length === 0 && <p className="text-center text-gray-500 mt-8">No {view} found.</p>}
          </ul>
        )}
      </div>

      <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={formState.type + formState.data?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderForm()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContentManager;
