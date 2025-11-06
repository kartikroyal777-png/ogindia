import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Day } from '../../types';

interface DayFormProps {
  day: Day | null;
  cityId: string;
  onSave: () => void;
}

const initialDayState: Partial<Day> = {
  day_number: 1,
  title: '',
};

const DayForm: React.FC<DayFormProps> = ({ day, cityId, onSave }) => {
  const [formData, setFormData] = useState<Partial<Day>>(initialDayState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(day ? { day_number: day.day_number, title: day.title } : initialDayState);
  }, [day]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'day_number' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dataToSave = { ...formData, city_id: cityId };

    const { error: apiError } = day?.id
      ? await supabase.from('days').update(dataToSave).eq('id', day.id)
      : await supabase.from('days').insert(dataToSave);

    if (apiError) {
      setError(apiError.message);
    } else {
      onSave();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
      <h3 className="text-lg font-medium">{day ? 'Edit Day' : 'Add New Day'}</h3>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <div>
            <label htmlFor="day_number" className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
            <input id="day_number" name="day_number" type="number" value={formData.day_number || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min={1} required />
        </div>
        <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input id="title" name="title" type="text" value={formData.title || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., Lakes and Palaces" required />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 text-sm font-medium">
          {loading ? 'Saving...' : 'Save Day'}
        </button>
      </div>
    </form>
  );
};

export default DayForm;
