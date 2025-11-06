-- Add booking links to location details and seed more cities

-- 1. Add new cities to populate the home page
INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info)
VALUES
  ('Mumbai', 'Maharashtra', 'The bustling financial capital and home of Bollywood.', 'The City of Dreams', 'https://images.unsplash.com/photo-1562979314-199a0e3c35d7?w=400&h=300&fit=crop', 94, 7, 'October to February', 'Humid climate, heavy monsoons'),
  ('Varanasi', 'Uttar Pradesh', 'A spiritual city on the banks of the river Ganges, one of the oldest living cities in the world.', 'The Spiritual Capital of India', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&h=300&fit=crop', 88, 7, 'October to March', 'Hot summers, pleasant winters'),
  ('Goa', 'Goa', 'Famous for its pristine beaches, vibrant nightlife, and Portuguese heritage.', 'The Party Capital', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop', 91, 9, 'November to February', 'Tropical climate'),
  ('Rishikesh', 'Uttarakhand', 'Known as the "Yoga Capital of the World", nestled in the Himalayan foothills.', 'Gateway to the Garhwal Himalayas', 'https://images.unsplash.com/photo-1588894987405-3dd96e243b69?w=400&h=300&fit=crop', 85, 9, 'September to June', 'Pleasant weather, cool winters')
ON CONFLICT (name) DO NOTHING;

-- 2. Update existing locations to include new booking_info structure
-- This ensures the new fields are available for editing.
UPDATE public.locations
SET details = details || '{
  "booking_info": {
    "package_booking_link": null,
    "vehicle_rental_link": null
  }
}'::jsonb
WHERE details ->> 'booking_info' IS NULL;

-- 3. Add example booking links to City Palace, Udaipur
UPDATE public.locations
SET details = jsonb_set(
    details,
    '{booking_info}',
    '{
      "package_booking_link": "https://www.getyourguide.com/udaipur-l392/udaipur-private-city-palace-and-boat-ride-tour-t132870/",
      "vehicle_rental_link": "https://www.savaari.com/udaipur/udaipur-car-rental"
    }'::jsonb,
    true
)
WHERE name = 'City Palace';
