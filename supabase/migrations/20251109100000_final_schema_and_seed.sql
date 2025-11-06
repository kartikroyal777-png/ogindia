-- This script completely resets and rebuilds the database schema.
-- It ensures a clean state, fixes structural issues, and seeds the database with rich demo data.

-- Drop existing objects in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS public.day_locations CASCADE;
DROP TABLE IF EXISTS public.location_images CASCADE;
DROP TABLE IF EXISTS public.saved_places CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.days CASCADE;
DROP TABLE IF EXISTS public.city_categories CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.phrases CASCADE;
DROP TABLE IF EXISTS public.bargaining_price_guide CASCADE;
DROP TABLE IF EXISTS public.saved_trips CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop dependent types if they exist
DROP TYPE IF EXISTS public.plan_type;
DROP TYPE IF EXISTS public.time_of_day;

-- Create ENUM types
CREATE TYPE public.plan_type AS ENUM ('free', 'paid');
CREATE TYPE public.time_of_day AS ENUM ('Morning', 'Afternoon', 'Evening', 'Anytime');

-- Create tables
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    plan_type public.plan_type NOT NULL DEFAULT 'free',
    food_scanner_used integer NOT NULL DEFAULT 0,
    trip_planner_used integer NOT NULL DEFAULT 0
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    icon text,
    emoji text
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public." ON public.categories FOR SELECT USING (true);

CREATE TABLE public.cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    state text,
    description text,
    short_tagline text,
    thumbnail_url text,
    popularity_score integer DEFAULT 50,
    safety_score integer DEFAULT 5,
    best_time_to_visit text,
    weather_info text
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are public." ON public.cities FOR SELECT USING (true);

CREATE TABLE public.city_categories (
    city_id uuid NOT NULL REFERENCES public.cities ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories ON DELETE CASCADE,
    PRIMARY KEY (city_id, category_id)
);
ALTER TABLE public.city_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "City categories are public." ON public.city_categories FOR SELECT USING (true);

CREATE TABLE public.days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id uuid NOT NULL REFERENCES public.cities ON DELETE CASCADE,
    day_number integer NOT NULL,
    title text,
    UNIQUE (city_id, day_number)
);
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Days are public." ON public.days FOR SELECT USING (true);

CREATE TABLE public.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id uuid REFERENCES public.days ON DELETE SET NULL,
    timing_tag public.time_of_day,
    name text NOT NULL UNIQUE,
    category text,
    short_intro text,
    image_url text,
    latitude double precision,
    longitude double precision,
    details jsonb
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are public." ON public.locations FOR SELECT USING (true);

CREATE TABLE public.location_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL REFERENCES public.locations ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text text
);
ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location images are public." ON public.location_images FOR SELECT USING (true);

CREATE TABLE public.saved_places (
    user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, location_id)
);
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved places." ON public.saved_places FOR ALL USING (auth.uid() = user_id);

-- is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'kartikroyal777@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies
ALTER TABLE public.categories add policy "Admins can manage categories." FOR ALL USING (public.is_admin());
ALTER TABLE public.cities add policy "Admins can manage cities." FOR ALL USING (public.is_admin());
ALTER TABLE public.city_categories add policy "Admins can manage city categories." FOR ALL USING (public.is_admin());
ALTER TABLE public.days add policy "Admins can manage days." FOR ALL USING (public.is_admin());
ALTER TABLE public.locations add policy "Admins can manage locations." FOR ALL USING (public.is_admin());
ALTER TABLE public.location_images add policy "Admins can manage location images." FOR ALL USING (public.is_admin());

-- SEED DATA
DO $$
DECLARE
  udaipur_id uuid;
  jaipur_id uuid;
  agra_id uuid;
  day1_udaipur_id uuid;
  day2_udaipur_id uuid;
  day1_jaipur_id uuid;
BEGIN
  -- Insert Cities
  INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit)
  VALUES
    ('Udaipur', 'Rajasthan', 'Often called the "Venice of the East," Udaipur is known for its serene lakes, royal palaces, and vibrant culture.', 'The City of Lakes', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=800&h=600&fit=crop', 94, 9, 'Sep - Mar'),
    ('Jaipur', 'Rajasthan', 'The Pink City, a bustling capital filled with historic forts, palaces, and colorful markets.', 'The Pink City', 'https://images.unsplash.com/photo-1603262339346-d8c29a8a015c?w=800&h=600&fit=crop', 92, 8, 'Oct - Mar'),
    ('Agra', 'Uttar Pradesh', 'Home to the iconic Taj Mahal, Agra is a city steeped in Mughal history and architectural wonders.', 'The City of Taj', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop', 95, 7, 'Oct - Mar')
  RETURNING id INTO udaipur_id, jaipur_id, agra_id;

  -- Insert Days
  INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 1, 'Lakeside Royalty') RETURNING id INTO day1_udaipur_id;
  INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 2, 'Cultural Immersion') RETURNING id INTO day2_udaipur_id;
  INSERT INTO public.days (city_id, day_number, title) VALUES (jaipur_id, 1, 'The Pink City Experience') RETURNING id INTO day1_jaipur_id;

  -- Insert Locations
  INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details)
  VALUES (
    day1_udaipur_id,
    'Morning',
    'City Palace, Udaipur', 'Royal Palace', 'A majestic palace complex on the banks of Lake Pichola, showcasing a blend of Rajasthani and Mughal architectural styles.', 'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop', 24.5762, 73.6835,
    '{ "about": { "historical_background": "Built over a period of nearly 400 years, with contributions from several rulers of the Mewar dynasty. Construction began in 1553 by Maharana Udai Singh II.", "cultural_significance": "It is the heart of Udaipur and a symbol of the Mewar kingdom''s power and prestige. The palace is still partially owned by the royal family.", "why_famous": "Famous for its intricate architecture, sprawling courtyards, and the stunning views it offers of Lake Pichola and the surrounding city." }, "opening_hours": { "daily_timings": {"open": "09:30 AM", "close": "05:30 PM"}, "weekly_closures": [], "seasonal_changes": "Timings might change during festivals." }, "best_time_to_visit": { "best_season": "Winter (October - March)", "best_time_of_day": "Morning to avoid crowds and heat.", "festival_timing": "Holi and Diwali are celebrated with grandeur." }, "transport": { "nearest_airport": "Maharana Pratap Airport (UDR), 22km", "nearest_railway_station": "Udaipur City Railway Station, 3km", "last_mile_options": "Auto-rickshaws and taxis are readily available. It is located in the old city, accessible by narrow lanes.", "taxi_cost_estimate": "₹150-200 from the railway station." }, "safety_risks": { "safety_score": 9, "scams_warnings": ["Beware of unofficial guides at the entrance.", "Some shops inside may be overpriced."], "womens_safety_rating": "High", "emergency_contacts": [{"name": "Tourist Police", "number": "1363"}] }, "cultural_etiquette": { "dress_code": "Respectful attire is recommended; cover shoulders and knees.", "dos_donts": ["Do hire an official audio guide.", "Don''t touch the artifacts."], "temple_etiquette": "Remove shoes before entering small shrines within the complex.", "photography_rules": "Photography is allowed, but may require an extra fee for video cameras." }, "costs_money": { "ticket_prices": {"local": "₹30", "foreigner": "₹300"}, "avg_budget_per_day": "₹500-700 per person (including tickets and guide).", "haggling_info": "Not applicable for tickets, but required for souvenirs outside.", "digital_payment_availability": "Yes, at the ticket counter." }, "amenities": { "toilets": "Available, but can be crowded.", "wifi": "Not available.", "seating": "Available in courtyards.", "water_refills": "Available for purchase.", "cloakrooms": "Available near the entrance." }, "hygiene_index": {"rating": 4, "notes": "Well-maintained premises."}, "guides": {"availability": "Official guides and audio guides available.", "booking_info": "Available at the entrance."}, "map_navigation": {"google_maps_link": "https://goo.gl/maps/qE5gS3aJmSq1z5d5A"}, "events_festivals": {"event_name": "Holika Dahan Ceremony", "event_date": "March (eve of Holi)", "type": "Cultural"}, "things_to_do": { "main_activities": ["Explore the museum", "Visit the Crystal Gallery", "Enjoy the view of Lake Pichola", "See the vintage car collection."], "nearby_attractions": ["Jagdish Temple", "Bagore Ki Haveli"] }, "photo_spots": [ {"title": "Tripolia Gate View", "description": "Classic shot of the palace entrance.", "image_url": "https://images.unsplash.com/photo-1621363613613-3942ad268953?w=400&h=300", "map_link": ""}, {"title": "Mor Chowk (Peacock Courtyard)", "description": "Famous for its intricate glass mosaics of peacocks.", "image_url": "https://images.unsplash.com/photo-1603813693370-97495a2306a4?w=400&h=300", "map_link": ""} ], "recommended_restaurants": [], "recommended_hotels": [], "local_foods": [], "influencer_videos": [] }'::jsonb
  );

  INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude)
  VALUES (day1_udaipur_id, 'Evening', 'Lake Pichola', 'Lake', 'An artificial fresh water lake, created in the year 1362 AD, named after the nearby Picholi village.', 'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop', 24.57, 73.68);

  INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude)
  VALUES (day1_jaipur_id, 'Morning', 'Hawa Mahal', 'Palace', 'A palace in Jaipur, India. Made with the red and pink sandstone, it sits on the edge of the City Palace, Jaipur.', 'https://images.unsplash.com/photo-1524230507669-3ff942151623?w=800&h=600&fit=crop', 26.9239, 75.8267);
END $$;
