import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { Location, TimeOfDay, LocationImage } from '../../types';
    import { Trash2, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react';

    interface LocationFormProps {
      location: Location | null;
      dayId: string;
      onSave: () => void;
    }

    const getDefaultDetails = (): Location['details'] => ({
      about: { historical_background: '', cultural_significance: '', why_famous: '' },
      opening_hours: { daily_timings: { open: '09:00 AM', close: '05:00 PM' }, weekly_closures: [], seasonal_changes: '' },
      best_time_to_visit: { best_season: '', best_time_of_day: '', festival_timing: '' },
      transport: { nearest_airport: '', nearest_railway_station: '', last_mile_options: '', taxi_cost_estimate: '' },
      safety_risks: { safety_score: 5, scams_warnings: [], womens_safety_rating: 'Medium', emergency_contacts: [] },
      cultural_etiquette: { dress_code: '', dos_donts: [], temple_etiquette: '', photography_rules: '' },
      costs_money: { ticket_prices: { local: '', foreigner: '' }, avg_budget_per_day: '', haggling_info: '', digital_payment_availability: '' },
      amenities: { toilets: '', wifi: '', seating: '', water_refills: '', cloakrooms: '' },
      hygiene_index: { rating: 3, notes: '' },
      guides: { availability: '', booking_info: '' },
      map_navigation: { google_maps_link: '' },
      events_festivals: { event_name: '', event_date: '', type: '' },
      things_to_do: { main_activities: [], nearby_attractions: [] },
      photo_spots: [], recommended_restaurants: [], recommended_hotels: [], local_foods: [], influencer_videos: [],
      booking_info: { package_booking_link: '', vehicle_rental_link: '' },
    });

    const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
      <details className="border p-4 rounded-lg bg-gray-50" open>
        <summary className="font-medium cursor-pointer text-gray-800">{title}</summary>
        <div className="mt-4 space-y-4">{children}</div>
      </details>
    );

    const FormInput: React.FC<any> = ({ label, ...props }) => (
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white" />
      </div>
    );

    const FormTextarea: React.FC<any> = ({ label, ...props }) => (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
          <textarea {...props} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white" rows={3} />
        </div>
    );

    const ArrayInput: React.FC<{label: string, items: string[], onChange: (newItems: string[]) => void}> = ({label, items, onChange}) => (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            {items.map((item, i) => (
                <div key={i} className="flex items-center space-x-2 mb-2">
                    <input value={item} onChange={e => { const newItems = [...items]; newItems[i] = e.target.value; onChange(newItems); }} className="w-full p-2 border rounded-lg text-sm bg-white" />
                    <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...items, ''])} className="text-sm text-blue-600 flex items-center space-x-1"><PlusCircle className="w-4 h-4" /><span>Add</span></button>
        </div>
    );
    
    type ObjectArrayKey = 'photo_spots' | 'recommended_restaurants' | 'recommended_hotels' | 'local_foods' | 'influencer_videos' | 'main_activities';

    const ObjectArrayInput: React.FC<{
      label: string;
      items: any[];
      onChange: (newItems: any[]) => void;
      fields: { name: string; label: string; type?: string }[];
    }> = ({ label, items, onChange, fields }) => {
      const handleItemChange = (index: number, fieldName: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [fieldName]: value };
        onChange(newItems);
      };
    
      const addItem = () => {
        const newItem = fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
        onChange([...items, newItem]);
      };
    
      const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
      };

      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="border p-3 rounded-lg bg-white space-y-2 relative">
                <button type="button" onClick={() => removeItem(i)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                {fields.map(field => (
                  <FormInput
                    key={field.name}
                    label={field.label}
                    type={field.type || 'text'}
                    value={item[field.name] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(i, field.name, e.target.value)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 flex items-center space-x-1"><PlusCircle className="w-4 h-4" /><span>Add {label.slice(0, -1)}</span></button>
        </div>
      );
    };


    const LocationForm: React.FC<LocationFormProps> = ({ location, dayId, onSave }) => {
      const [formData, setFormData] = useState<Partial<Location>>(createInitialState());
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      function createInitialState(): Partial<Location> {
        const defaultDetails = getDefaultDetails();
        if (location) {
            const locationDetails = location.details || {};
            const mergedDetails = JSON.parse(JSON.stringify(defaultDetails)); // Deep copy
            
            for (const sectionKey in mergedDetails) {
                if (locationDetails[sectionKey]) {
                    if (typeof mergedDetails[sectionKey] === 'object' && !Array.isArray(mergedDetails[sectionKey])) {
                        mergedDetails[sectionKey] = { ...mergedDetails[sectionKey], ...locationDetails[sectionKey] };
                    } else {
                        mergedDetails[sectionKey] = locationDetails[sectionKey];
                    }
                }
            }
            return { ...location, details: mergedDetails };
        }
        return {
          name: '', category: '', short_intro: '', image_url: '', latitude: null, longitude: null,
          day_id: dayId, timing_tag: 'Morning', details: defaultDetails, images: []
        };
      }

      useEffect(() => {
        setFormData(createInitialState());
      }, [location, dayId]);

      const handleSimpleChange = (field: keyof Location, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
      };

      const handleDetailChange = (path: (string | number)[], value: any) => {
        setFormData(prev => {
          const newDetails = JSON.parse(JSON.stringify(prev.details || {}));
          let current = newDetails;
          for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === undefined) current[path[i]] = {};
            current = current[path[i]];
          }
          current[path[path.length - 1]] = value;
          return { ...prev, details: newDetails };
        });
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { id, images, day, ...dataToSave } = formData;
        const finalData = { ...dataToSave, day_id: dayId };

        const { data: savedLocation, error: locationError } = id
          ? await supabase.from('locations').update(finalData).eq('id', id).select().single()
          : await supabase.from('locations').insert(finalData).select().single();

        if (locationError) { setError(locationError.message); setLoading(false); return; }
        onSave();
        setLoading(false);
      };
      
      const d = formData.details || getDefaultDetails();

      return (
        <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
          <h3 className="text-lg font-medium">{location ? 'Edit Location' : 'Add New Location'}</h3>
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            <FormSection title="Basic Information">
                <FormInput label="Location Name" value={formData.name || ''} onChange={(e:any) => handleSimpleChange('name', e.target.value)} />
                <FormInput label="Category" value={formData.category || ''} onChange={(e:any) => handleSimpleChange('category', e.target.value)} />
                <FormTextarea label="Short Intro" value={formData.short_intro || ''} onChange={(e:any) => handleSimpleChange('short_intro', e.target.value)} />
                <FormInput label="Main Image URL" value={formData.image_url || ''} onChange={(e:any) => handleSimpleChange('image_url', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Latitude" type="number" step="any" value={formData.latitude || ''} onChange={(e:any) => handleSimpleChange('latitude', parseFloat(e.target.value))} />
                    <FormInput label="Longitude" type="number" step="any" value={formData.longitude || ''} onChange={(e:any) => handleSimpleChange('longitude', parseFloat(e.target.value))} />
                </div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Timing Tag</label>
                <select value={formData.timing_tag || 'Morning'} onChange={(e:any) => handleSimpleChange('timing_tag', e.target.value as TimeOfDay)} className="w-full p-2 border rounded-lg text-sm bg-white">
                    <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Anytime</option>
                </select>
            </FormSection>
            
            <FormSection title="About">
              <FormTextarea label="Historical Background" value={d.about?.historical_background || ''} onChange={(e:any) => handleDetailChange(['about', 'historical_background'], e.target.value)} />
              <FormTextarea label="Cultural Significance" value={d.about?.cultural_significance || ''} onChange={(e:any) => handleDetailChange(['about', 'cultural_significance'], e.target.value)} />
              <FormTextarea label="Why Famous" value={d.about?.why_famous || ''} onChange={(e:any) => handleDetailChange(['about', 'why_famous'], e.target.value)} />
            </FormSection>
            
            <FormSection title="Booking & Rentals">
              <FormInput label="Package Booking Link" value={d.booking_info?.package_booking_link || ''} onChange={(e:any) => handleDetailChange(['booking_info', 'package_booking_link'], e.target.value)} />
              <FormInput label="Vehicle Rental Link" value={d.booking_info?.vehicle_rental_link || ''} onChange={(e:any) => handleDetailChange(['booking_info', 'vehicle_rental_link'], e.target.value)} />
            </FormSection>

            <FormSection title="Opening Hours">
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Open Time" value={d.opening_hours?.daily_timings?.open || ''} onChange={(e:any) => handleDetailChange(['opening_hours', 'daily_timings', 'open'], e.target.value)} />
                    <FormInput label="Close Time" value={d.opening_hours?.daily_timings?.close || ''} onChange={(e:any) => handleDetailChange(['opening_hours', 'daily_timings', 'close'], e.target.value)} />
                </div>
                <ArrayInput label="Weekly Closures" items={d.opening_hours?.weekly_closures || []} onChange={(newItems) => handleDetailChange(['opening_hours', 'weekly_closures'], newItems)} />
                <FormInput label="Seasonal Changes" value={d.opening_hours?.seasonal_changes || ''} onChange={(e:any) => handleDetailChange(['opening_hours', 'seasonal_changes'], e.target.value)} />
            </FormSection>

            <FormSection title="Best Time to Visit">
                <FormInput label="Best Season" value={d.best_time_to_visit?.best_season || ''} onChange={(e:any) => handleDetailChange(['best_time_to_visit', 'best_season'], e.target.value)} />
                <FormInput label="Best Time of Day" value={d.best_time_to_visit?.best_time_of_day || ''} onChange={(e:any) => handleDetailChange(['best_time_to_visit', 'best_time_of_day'], e.target.value)} />
                <FormInput label="Festival Timing" value={d.best_time_to_visit?.festival_timing || ''} onChange={(e:any) => handleDetailChange(['best_time_to_visit', 'festival_timing'], e.target.value)} />
            </FormSection>

            <FormSection title="Transport">
                <FormInput label="Nearest Airport" value={d.transport?.nearest_airport || ''} onChange={(e:any) => handleDetailChange(['transport', 'nearest_airport'], e.target.value)} />
                <FormInput label="Nearest Railway Station" value={d.transport?.nearest_railway_station || ''} onChange={(e:any) => handleDetailChange(['transport', 'nearest_railway_station'], e.target.value)} />
                <FormTextarea label="Last-Mile Options" value={d.transport?.last_mile_options || ''} onChange={(e:any) => handleDetailChange(['transport', 'last_mile_options'], e.target.value)} />
                <FormInput label="Taxi Cost Estimate" value={d.transport?.taxi_cost_estimate || ''} onChange={(e:any) => handleDetailChange(['transport', 'taxi_cost_estimate'], e.target.value)} />
            </FormSection>

            <FormSection title="Safety & Risks">
                <FormInput label="Safety Score (1-10)" type="number" value={d.safety_risks?.safety_score || 5} onChange={(e:any) => handleDetailChange(['safety_risks', 'safety_score'], parseInt(e.target.value))} />
                <FormInput label="Women's Safety Rating" value={d.safety_risks?.womens_safety_rating || ''} onChange={(e:any) => handleDetailChange(['safety_risks', 'womens_safety_rating'], e.target.value)} />
                <ArrayInput label="Scam Warnings" items={d.safety_risks?.scams_warnings || []} onChange={(newItems) => handleDetailChange(['safety_risks', 'scams_warnings'], newItems)} />
            </FormSection>

            <FormSection title="Cultural Etiquette">
                <FormInput label="Dress Code" value={d.cultural_etiquette?.dress_code || ''} onChange={(e:any) => handleDetailChange(['cultural_etiquette', 'dress_code'], e.target.value)} />
                <FormInput label="Temple Etiquette" value={d.cultural_etiquette?.temple_etiquette || ''} onChange={(e:any) => handleDetailChange(['cultural_etiquette', 'temple_etiquette'], e.target.value)} />
                <FormInput label="Photography Rules" value={d.cultural_etiquette?.photography_rules || ''} onChange={(e:any) => handleDetailChange(['cultural_etiquette', 'photography_rules'], e.target.value)} />
                <ArrayInput label="Do's and Don'ts" items={d.cultural_etiquette?.dos_donts || []} onChange={(newItems) => handleDetailChange(['cultural_etiquette', 'dos_donts'], newItems)} />
            </FormSection>

            <FormSection title="Costs & Money">
                <FormInput label="Local Ticket Price" value={d.costs_money?.ticket_prices?.local || ''} onChange={(e:any) => handleDetailChange(['costs_money', 'ticket_prices', 'local'], e.target.value)} />
                <FormInput label="Foreigner Ticket Price" value={d.costs_money?.ticket_prices?.foreigner || ''} onChange={(e:any) => handleDetailChange(['costs_money', 'ticket_prices', 'foreigner'], e.target.value)} />
                <FormInput label="Avg. Budget Per Day" value={d.costs_money?.avg_budget_per_day || ''} onChange={(e:any) => handleDetailChange(['costs_money', 'avg_budget_per_day'], e.target.value)} />
                <FormInput label="Haggling Info" value={d.costs_money?.haggling_info || ''} onChange={(e:any) => handleDetailChange(['costs_money', 'haggling_info'], e.target.value)} />
                <FormInput label="Digital Payment Availability" value={d.costs_money?.digital_payment_availability || ''} onChange={(e:any) => handleDetailChange(['costs_money', 'digital_payment_availability'], e.target.value)} />
            </FormSection>

            <FormSection title="Amenities">
                <FormInput label="Toilets" value={d.amenities?.toilets || ''} onChange={(e:any) => handleDetailChange(['amenities', 'toilets'], e.target.value)} />
                <FormInput label="WiFi" value={d.amenities?.wifi || ''} onChange={(e:any) => handleDetailChange(['amenities', 'wifi'], e.target.value)} />
                <FormInput label="Seating" value={d.amenities?.seating || ''} onChange={(e:any) => handleDetailChange(['amenities', 'seating'], e.target.value)} />
                <FormInput label="Water Refills" value={d.amenities?.water_refills || ''} onChange={(e:any) => handleDetailChange(['amenities', 'water_refills'], e.target.value)} />
                <FormInput label="Cloakrooms" value={d.amenities?.cloakrooms || ''} onChange={(e:any) => handleDetailChange(['amenities', 'cloakrooms'], e.target.value)} />
            </FormSection>

            <FormSection title="Things To Do">
                <ObjectArrayInput 
                  label="Main Activities"
                  items={d.things_to_do?.main_activities || []}
                  onChange={(newItems) => handleDetailChange(['things_to_do', 'main_activities'], newItems)}
                  fields={[
                    { name: 'title', label: 'Activity Title' },
                    { name: 'description', label: 'Description' },
                    { name: 'image_url', label: 'Image URL' },
                  ]}
                />
                <ArrayInput label="Nearby Attractions" items={d.things_to_do?.nearby_attractions || []} onChange={(newItems) => handleDetailChange(['things_to_do', 'nearby_attractions'], newItems)} />
            </FormSection>
            
            <FormSection title="Media & Recommendations">
              <ObjectArrayInput 
                label="Photo Spots"
                items={d.photo_spots || []}
                onChange={(newItems) => handleDetailChange(['photo_spots'], newItems)}
                fields={[
                  { name: 'title', label: 'Title' },
                  { name: 'description', label: 'Description' },
                  { name: 'image_url', label: 'Image URL' },
                  { name: 'map_link', label: 'Map Link' },
                ]}
              />
              <ObjectArrayInput 
                label="Recommended Restaurants"
                items={d.recommended_restaurants || []}
                onChange={(newItems) => handleDetailChange(['recommended_restaurants'], newItems)}
                fields={[
                  { name: 'name', label: 'Name' },
                  { name: 'image_url', label: 'Image URL' },
                  { name: 'map_link', label: 'Map Link' },
                ]}
              />
              <ObjectArrayInput 
                label="Recommended Hotels"
                items={d.recommended_hotels || []}
                onChange={(newItems) => handleDetailChange(['recommended_hotels'], newItems)}
                fields={[
                  { name: 'name', label: 'Name' },
                  { name: 'image_url', label: 'Image URL' },
                  { name: 'map_link', label: 'Map Link' },
                ]}
              />
              <ObjectArrayInput 
                label="Local Foods to Try"
                items={d.local_foods || []}
                onChange={(newItems) => handleDetailChange(['local_foods'], newItems)}
                fields={[
                  { name: 'name', label: 'Food Name' },
                  { name: 'shop', label: 'Recommended Shop' },
                  { name: 'image_url', label: 'Image URL' },
                  { name: 'map_link', label: 'Map Link' },
                ]}
              />
              <ObjectArrayInput 
                label="Influencer Videos"
                items={d.influencer_videos || []}
                onChange={(newItems) => handleDetailChange(['influencer_videos'], newItems)}
                fields={[
                  { name: 'title', label: 'Video Title' },
                  { name: 'video_id', label: 'YouTube Video ID' },
                  { name: 'influencer_name', label: 'Influencer Name' },
                ]}
              />
            </FormSection>

          </div>
          {error && <p className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 text-sm font-medium">
              {loading ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </form>
      );
    };

    export default LocationForm;
