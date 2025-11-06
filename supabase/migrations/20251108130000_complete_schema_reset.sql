-- ========= FULL SCHEMA RESET AND SEED =========
-- This script will drop all existing public tables and recreate them.
-- It fixes previous migration errors and seeds the database with demo data.

-- ========= 1. CLEANUP =========
-- Drop existing objects in reverse order of dependency to avoid errors.
DROP POLICY IF EXISTS "Admins can manage bargaining_price_guide" ON public.bargaining_price_guide;
DROP POLICY IF EXISTS "Public can read bargaining_price_guide" ON public.bargaining_price_guide;
DROP POLICY IF EXISTS "Admins can manage phrases" ON public.phrases;
DROP POLICY IF EXISTS "Public can read phrases" ON public.phrases;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own saved_trips" ON public.saved_trips;
DROP POLICY IF EXISTS "Users can manage their own saved_places" ON public.saved_places;
DROP POLICY IF EXISTS "Admins can manage location_images" ON public.location_images;
DROP POLICY IF EXISTS "Public can read location_images" ON public.location_images;
DROP POLICY IF EXISTS "Admins can manage day_locations" ON public.day_locations;
DROP POLICY IF EXISTS "Public can read day_locations" ON public.day_locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Public can read locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage days" ON public.days;
DROP POLICY IF EXISTS "Public can read days" ON public.days;
DROP POLICY IF EXISTS "Admins can manage city_categories" ON public.city_categories;
DROP POLICY IF EXISTS "Public can read city_categories" ON public.city_categories;
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
DROP POLICY IF EXISTS "Public can read cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;

DROP TABLE IF EXISTS public.day_locations CASCADE;
DROP TABLE IF EXISTS public.location_images CASCADE;
DROP TABLE IF EXISTS public.saved_places CASCADE;
DROP TABLE IF EXISTS public.saved_trips CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.days CASCADE;
DROP TABLE IF EXISTS public.city_categories CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.phrases CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.bargaining_price_guide CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TYPE IF EXISTS public.time_of_day;

-- ========= 2. HELPERS AND TYPES =========
-- is_admin function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT count(*)
    FROM pg_roles
    WHERE rolname = 'service_role'
      AND oid = auth.role()::oid
  ) > 0 OR (
    SELECT email
    FROM auth.users
    WHERE id = auth.uid()
  ) = 'kartikroyal777@gmail.com';
END;
$$;

-- Trigger function to create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

-- Custom enum type for location timings
CREATE TYPE public.time_of_day AS ENUM ('Morning', 'Afternoon', 'Evening', 'Anytime');

-- ========= 3. TABLE CREATION =========
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  plan_type text DEFAULT 'free'::text NOT NULL,
  food_scanner_used integer DEFAULT 0 NOT NULL,
  trip_planner_used integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text,
  emoji text
);

CREATE TABLE public.cities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  state text,
  description text,
  short_tagline text,
  thumbnail_url text,
  popularity_score integer,
  safety_score integer,
  best_time_to_visit text,
  weather_info text
);

CREATE TABLE public.city_categories (
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (city_id, category_id)
);

CREATE TABLE public.days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text,
  UNIQUE (city_id, day_number)
);

CREATE TABLE public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text,
  short_intro text,
  image_url text,
  latitude numeric,
  longitude numeric,
  details jsonb
);

CREATE TABLE public.day_locations (
  day_id uuid NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  timing_tag public.time_of_day,
  PRIMARY KEY (day_id, location_id)
);

CREATE TABLE public.location_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  image_url text,
  alt_text text
);

CREATE TABLE public.phrases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  en text NOT NULL,
  hi text NOT NULL,
  pronunciation text,
  is_adult boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
  id serial PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.bargaining_price_guide (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name text NOT NULL,
  item_name text NOT NULL,
  fair_price_range text,
  quoted_price_range text
);

CREATE TABLE public.saved_places (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, location_id)
);

CREATE TABLE public.saved_trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  trip_details jsonb
);

-- ========= 4. TRIGGERS =========
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========= 5. RLS POLICIES =========
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CATEGORIES, CITIES, DAYS, LOCATIONS, etc. (Admin write, public read)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.city_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read city_categories" ON public.city_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage city_categories" ON public.city_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read days" ON public.days FOR SELECT USING (true);
CREATE POLICY "Admins can manage days" ON public.days FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.day_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read day_locations" ON public.day_locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage day_locations" ON public.day_locations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read location_images" ON public.location_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage location_images" ON public.location_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.phrases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read phrases" ON public.phrases FOR SELECT USING (true);
CREATE POLICY "Admins can manage phrases" ON public.phrases FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.bargaining_price_guide ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read bargaining_price_guide" ON public.bargaining_price_guide FOR SELECT USING (true);
CREATE POLICY "Admins can manage bargaining_price_guide" ON public.bargaining_price_guide FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SAVED_PLACES & SAVED_TRIPS (User-specific access)
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved_places" ON public.saved_places FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved_trips" ON public.saved_trips FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========= 6. SEED DATA =========
DO $$
DECLARE
  udaipur_id uuid;
  jaipur_id uuid;
  agra_id uuid;
  day1_id uuid;
  day2_id uuid;
  city_palace_id uuid;
  jagdish_temple_id uuid;
  saheliyon_ki_bari_id uuid;
BEGIN
  -- Seed Cities
  INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
  ('Udaipur', 'Rajasthan', 'The city of lakes, known for its romantic palaces and vibrant culture.', 'Venice of the East', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=800&h=600&fit=crop', 94, 9, 'September to March', 'Pleasant winters, hot summers.') RETURNING id INTO udaipur_id;
  
  INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
  ('Jaipur', 'Rajasthan', 'The vibrant pink city known for palaces, forts, and colorful bazaars.', 'The Pink City', 'https://images.unsplash.com/photo-1603262339346-d8c29a8a015c?w=800&h=600&fit=crop', 92, 8, 'October to March', 'Desert climate with cool winters.') RETURNING id INTO jaipur_id;

  INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
  ('Agra', 'Uttar Pradesh', 'Home to the magnificent Taj Mahal and rich Mughal heritage.', 'The City of Love', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop', 95, 7, 'October to March', 'Cool and pleasant winters, hot summers.') RETURNING id INTO agra_id;

  -- Seed Days for Udaipur
  INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 1, 'Royal Palaces & Lakeside Charm') RETURNING id INTO day1_id;
  INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 2, 'Gardens, Arts, and Sunset Views') RETURNING id INTO day2_id;

  -- Seed Locations for Udaipur Day 1
  INSERT INTO public.locations (name, category, short_intro, image_url, latitude, longitude, details) VALUES (
    'City Palace, Udaipur', 'Royal Palace', 'A majestic palace complex on the banks of Lake Pichola, showcasing a blend of Rajasthani and Mughal architectural styles.',
    'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop', 24.5762, 73.6835,
    '{
        "about": {
            "historical_background": "Built over a period of nearly 400 years, with contributions from several rulers of the Mewar dynasty. Construction began in 1553 by Maharana Udai Singh II.",
            "cultural_significance": "It is the heart of Udaipur and a symbol of the Mewar kingdom''s power and prestige. The palace is still partially owned by the royal family.",
            "why_famous": "Famous for its intricate architecture, sprawling courtyards, and the stunning views it offers of Lake Pichola and the surrounding city."
        },
        "opening_hours": {
            "daily_timings": {"open": "09:30 AM", "close": "05:30 PM"},
            "weekly_closures": [],
            "seasonal_changes": "Timings might change during festivals."
        },
        "best_time_to_visit": {
            "best_season": "Winter (October - March)",
            "best_time_of_day": "Morning to avoid crowds and heat.",
            "festival_timing": "Holi and Diwali are celebrated with grandeur."
        },
        "transport": {
            "nearest_airport": "Maharana Pratap Airport (UDR), 22km",
            "nearest_railway_station": "Udaipur City Railway Station, 3km",
            "last_mile_options": "Auto-rickshaws and taxis are readily available. It is located in the old city, accessible by narrow lanes.",
            "taxi_cost_estimate": "₹150-200 from the railway station."
        },
        "safety_risks": {
            "safety_score": 9,
            "scams_warnings": ["Beware of unofficial guides at the entrance.", "Some shops inside may be overpriced."],
            "womens_safety_rating": "High",
            "emergency_contacts": [{"name": "Tourist Police", "number": "1363"}]
        },
        "cultural_etiquette": {
            "dress_code": "Respectful attire is recommended; cover shoulders and knees.",
            "dos_donts": ["Do hire an official audio guide.", "Don''t touch the artifacts."],
            "temple_etiquette": "Remove shoes before entering small shrines within the complex.",
            "photography_rules": "Photography is allowed, but may require an extra fee for video cameras."
        },
        "costs_money": {
            "ticket_prices": {"local": "₹30", "foreigner": "₹300"},
            "avg_budget_per_day": "₹500-700 per person (including tickets and guide).",
            "haggling_info": "Not applicable for tickets, but required for souvenirs outside.",
            "digital_payment_availability": "Yes, at the ticket counter."
        },
        "amenities": {
            "toilets": "Available, but can be crowded.",
            "wifi": "Not available.",
            "seating": "Available in courtyards.",
            "water_refills": "Available for purchase.",
            "cloakrooms": "Available near the entrance."
        },
        "hygiene_index": {"rating": 4, "notes": "Well-maintained premises."},
        "guides": {"availability": "Official guides and audio guides available.", "booking_info": "Available at the entrance."},
        "map_navigation": {"google_maps_link": "https://goo.gl/maps/qE5gS3aJmSq1z5d5A"},
        "events_festivals": {"event_name": "Holika Dahan Ceremony", "event_date": "March (eve of Holi)", "type": "Cultural"},
        "things_to_do": {
            "main_activities": ["Explore the museum", "Visit the Crystal Gallery", "Enjoy the view of Lake Pichola", "See the vintage car collection."],
            "nearby_attractions": ["Jagdish Temple", "Bagore Ki Haveli"]
        },
        "photo_spots": [
            {"title": "Tripolia Gate View", "description": "Classic shot of the palace entrance.", "image_url": "https://images.unsplash.com/photo-1617594232302-702374dfce36?w=400&h=300", "map_link": ""},
            {"title": "Mor Chowk (Peacock Courtyard)", "description": "Famous for its intricate glass mosaics of peacocks.", "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846364?w=400&h=300", "map_link": ""}
        ],
        "recommended_restaurants": [], "recommended_hotels": [], "local_foods": [], "influencer_videos": []
    }'::jsonb
  ) RETURNING id INTO city_palace_id;
  
  INSERT INTO public.locations (name, category, short_intro, image_url, latitude, longitude, details) VALUES (
    'Jagdish Temple', 'Hindu Temple', 'A large and artistically important Hindu temple located in the City Palace complex of Udaipur.',
    'https://images.unsplash.com/photo-1621363613613-3942ad268953?w=800&h=600&fit=crop', 24.5795, 73.6835,
    '{"about": {"historical_background": "Built by Maharana Jagat Singh in 1651, it is dedicated to Lord Vishnu."}}'::jsonb
  ) RETURNING id INTO jagdish_temple_id;

  -- Seed Locations for Udaipur Day 2
  INSERT INTO public.locations (name, category, short_intro, image_url, latitude, longitude, details) VALUES (
    'Saheliyon Ki Bari', 'Garden', 'A beautiful garden and a popular tourist space in Udaipur, also known as the Garden of the Maidens.',
    'https://images.unsplash.com/photo-1603813693370-97495a2306a4?w=800&h=600&fit=crop', 24.6006, 73.6853,
    '{"about": {"historical_background": "Built by Maharana Sangram Singh for a group of 48 young women attendants who accompanied a princess to Udaipur as part of her dowry."}}'::jsonb
  ) RETURNING id INTO saheliyon_ki_bari_id;

  -- Link locations to days
  INSERT INTO public.day_locations (day_id, location_id, timing_tag) VALUES
  (day1_id, city_palace_id, 'Morning'),
  (day1_id, jagdish_temple_id, 'Afternoon');

  INSERT INTO public.day_locations (day_id, location_id, timing_tag) VALUES
  (day2_id, saheliyon_ki_bari_id, 'Morning');

  -- Seed some phrases
  INSERT INTO public.phrases (category, en, hi, pronunciation) VALUES
  ('General', 'Hello', 'नमस्ते', 'namaste'),
  ('General', 'Thank you', 'धन्यवाद', 'dhanyavaad'),
  ('Shopping', 'How much?', 'कितना हुआ?', 'kitnā huā?');
  
END $$;
