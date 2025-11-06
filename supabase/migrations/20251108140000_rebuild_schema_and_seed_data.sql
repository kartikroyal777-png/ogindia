-- Comprehensive Schema Rebuild and Data Seeding
-- This script drops existing tables to ensure a clean state and recreates the entire schema
-- with correct relationships and seeds it with comprehensive demo data.

-- Drop existing objects in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS public.location_images CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.days CASCADE;
DROP TABLE IF EXISTS public.city_categories CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TYPE IF EXISTS public.time_of_day;

-- Create ENUM type for time of day
CREATE TYPE public.time_of_day AS ENUM ('Morning', 'Afternoon', 'Evening', 'Anytime');

-- Create Tables
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    icon text,
    emoji text
);

CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    state text NOT NULL,
    description text,
    short_tagline text,
    thumbnail_url text,
    popularity_score integer DEFAULT 50,
    safety_score integer DEFAULT 5,
    best_time_to_visit text,
    weather_info text
);

CREATE TABLE public.city_categories (
    city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (city_id, category_id)
);

CREATE TABLE public.days (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    title text,
    UNIQUE(city_id, day_number)
);

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_id uuid REFERENCES public.days(id) ON DELETE SET NULL,
    timing_tag public.time_of_day,
    name text NOT NULL UNIQUE,
    category text,
    short_intro text,
    image_url text,
    latitude double precision,
    longitude double precision,
    details jsonb
);

CREATE TABLE public.location_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text text
);

-- Enable RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow public read access)
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Allow public read access on city_categories" ON public.city_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on days" ON public.days FOR SELECT USING (true);
CREATE POLICY "Allow public read access on locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow public read access on location_images" ON public.location_images FOR SELECT USING (true);

-- Create RLS policies for admin writes (based on your user logic)
CREATE POLICY "Allow admin full access" ON public.categories FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');
CREATE POLICY "Allow admin full access" ON public.cities FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');
CREATE POLICY "Allow admin full access" ON public.city_categories FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');
CREATE POLICY "Allow admin full access" ON public.days FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');
CREATE POLICY "Allow admin full access" ON public.locations FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');
CREATE POLICY "Allow admin full access" ON public.location_images FOR ALL USING (auth.email() = 'kartikroyal777@gmail.com') WITH CHECK (auth.email() = 'kartikroyal777@gmail.com');


-- Seed Data
DO $$
DECLARE
    udaipur_id uuid;
    jaipur_id uuid;
    agra_id uuid;
    udaipur_day1_id uuid;
    udaipur_day2_id uuid;
    jaipur_day1_id uuid;
    city_palace_id uuid;
    lake_pichola_id uuid;
    jagdish_temple_id uuid;
    hawa_mahal_id uuid;
BEGIN
    -- Seed Categories
    INSERT INTO public.categories (name, icon, emoji) VALUES
    ('Forts & Palaces', 'castle', '🏰'),
    ('Lakes & Rivers', 'waves', '🌊'),
    ('Temples', 'building', '🛕'),
    ('Markets', 'shopping-bag', '🛍️');

    -- Seed Cities
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
    ('Udaipur', 'Rajasthan', 'The romantic city of lakes, known for its lavish royal palaces and vibrant culture.', 'The Venice of the East', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=800&h=600&fit=crop', 94, 9, 'Sep - Mar', 'Pleasant winters, hot summers.') RETURNING id INTO udaipur_id;

    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
    ('Jaipur', 'Rajasthan', 'The Pink City, a bustling capital with majestic forts, royal palaces, and colorful bazaars.', 'The Pink City', 'https://images.unsplash.com/photo-1603262339346-d8c29a8a015c?w=800&h=600&fit=crop', 92, 8, 'Oct - Mar', 'Hot semi-arid climate.') RETURNING id INTO jaipur_id;
    
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info) VALUES
    ('Agra', 'Uttar Pradesh', 'Home to the iconic Taj Mahal, a city steeped in Mughal history and architectural wonders.', 'The City of Taj', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop', 95, 7, 'Oct - Mar', 'Humid subtropical climate.') RETURNING id INTO agra_id;

    -- Seed Days
    INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 1, 'Royal Palaces & Lake Views') RETURNING id INTO udaipur_day1_id;
    INSERT INTO public.days (city_id, day_number, title) VALUES (udaipur_id, 2, 'Culture & Sunset Vistas') RETURNING id INTO udaipur_day2_id;
    INSERT INTO public.days (city_id, day_number, title) VALUES (jaipur_id, 1, 'The Pink City''s Heart') RETURNING id INTO jaipur_day1_id;

    -- Seed Locations (with full details for City Palace)
    INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details) VALUES (
        udaipur_day1_id, 'Morning', 'City Palace', 'Royal Palace', 'A majestic palace complex on the banks of Lake Pichola, showcasing a blend of Rajasthani and Mughal architectural styles.', 'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop', 24.5762, 73.6835,
        '{
            "about": { "historical_background": "Built over nearly 400 years, with contributions from several rulers of the Mewar dynasty. Construction began in 1553 by Maharana Udai Singh II.", "cultural_significance": "It is the heart of Udaipur and a symbol of the Mewar kingdom''s power and prestige. The palace is still partially owned by the royal family.", "why_famous": "Famous for its intricate architecture, sprawling courtyards, and the stunning views it offers of Lake Pichola." },
            "opening_hours": { "daily_timings": {"open": "09:30 AM", "close": "05:30 PM"}, "weekly_closures": [], "seasonal_changes": "Timings might change during festivals." },
            "best_time_to_visit": { "best_season": "Winter (October - March)", "best_time_of_day": "Morning to avoid crowds and heat.", "festival_timing": "Holi and Diwali are celebrated with grandeur." },
            "transport": { "nearest_airport": "Maharana Pratap Airport (UDR), 22km", "nearest_railway_station": "Udaipur City Railway Station, 3km", "last_mile_options": "Auto-rickshaws and taxis are readily available. It is located in the old city, accessible by narrow lanes.", "taxi_cost_estimate": "₹150-200 from the railway station." },
            "safety_risks": { "safety_score": 9, "scams_warnings": ["Beware of unofficial guides at the entrance.", "Some shops inside may be overpriced."], "womens_safety_rating": "High", "emergency_contacts": [{"name": "Tourist Police", "number": "1363"}] },
            "cultural_etiquette": { "dress_code": "Respectful attire is recommended; cover shoulders and knees.", "dos_donts": ["Do hire an official audio guide.", "Don''t touch the artifacts."], "temple_etiquette": "Remove shoes before entering small shrines within the complex.", "photography_rules": "Photography is allowed, but may require an extra fee for video cameras." },
            "costs_money": { "ticket_prices": { "local": "₹30", "foreigner": "₹300" }, "avg_budget_per_day": "₹500-700 per person (including tickets and guide).", "haggling_info": "Not applicable for tickets, but required for souvenirs outside.", "digital_payment_availability": "Yes, at the ticket counter." },
            "amenities": { "toilets": "Available, but can be crowded.", "wifi": "Not available.", "seating": "Available in courtyards.", "water_refills": "Available for purchase.", "cloakrooms": "Available near the entrance." },
            "hygiene_index": {"rating": 4, "notes": "Well-maintained premises."},
            "guides": {"availability": "Official guides and audio guides available.", "booking_info": "Available at the entrance."},
            "map_navigation": {"google_maps_link": "https://goo.gl/maps/qE5gS3aJmSq1z5d5A"},
            "events_festivals": {"event_name": "Holika Dahan Ceremony", "event_date": "March (eve of Holi)", "type": "Cultural"},
            "things_to_do": { "main_activities": ["Explore the museum", "Visit the Crystal Gallery", "Enjoy the view of Lake Pichola", "See the vintage car collection."], "nearby_attractions": ["Jagdish Temple", "Bagore Ki Haveli"] },
            "photo_spots": [ {"title": "Tripolia Gate View", "description": "Classic shot of the palace entrance.", "image_url": "https://images.unsplash.com/photo-1621363613613-3942ad268953?w=400&h=300&fit=crop", "map_link": ""}, {"title": "Mor Chowk (Peacock Courtyard)", "description": "Famous for its intricate glass mosaics of peacocks.", "image_url": "https://images.unsplash.com/photo-1603813693370-97495a2306a4?w=400&h=300&fit=crop", "map_link": ""} ],
            "recommended_restaurants": [], "recommended_hotels": [], "local_foods": [], "influencer_videos": []
        }'::jsonb
    ) RETURNING id INTO city_palace_id;

    INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details) VALUES (
        udaipur_day1_id, 'Afternoon', 'Lake Pichola', 'Lake', 'An artificial fresh water lake, created in the year 1362 AD, named after the nearby Picholi village.', 'https://images.unsplash.com/photo-1585333527582-1b3509352436?w=800&h=600&fit=crop', 24.5721, 73.6755,
        '{"about": {"why_famous": "Famous for its scenic beauty and the palaces that dot its islands, including Jag Mandir and Jag Niwas (Lake Palace)."}, "things_to_do": {"main_activities": ["Boat ride during sunset", "Visit Jag Mandir island palace"]}}'::jsonb
    ) RETURNING id INTO lake_pichola_id;

    INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details) VALUES (
        udaipur_day1_id, 'Evening', 'Jagdish Temple', 'Temple', 'A large Hindu temple in the middle of Udaipur, just outside the royal palace.', 'https://images.unsplash.com/photo-1617094493245-357597a44a56?w=800&h=600&fit=crop', 24.5794, 73.6835,
        '{"about": {"why_famous": "A fine example of Indo-Aryan architecture, dedicated to Lord Vishnu."}, "cultural_etiquette": {"dress_code": "Cover shoulders and knees. Remove shoes before entering."}}'::jsonb
    ) RETURNING id INTO jagdish_temple_id;

    INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details) VALUES (
        jaipur_day1_id, 'Morning', 'Hawa Mahal', 'Palace', 'A palace of winds with a high screen wall built so the women of the royal household could observe street festivities unseen.', 'https://images.unsplash.com/photo-1617541224343-bce49a809768?w=800&h=600&fit=crop', 26.9239, 75.8267,
        '{"about": {"why_famous": "Its unique five-storey exterior is akin to the honeycomb of a beehive with its 953 small windows called Jharokhas decorated with intricate latticework."}, "costs_money": {"ticket_prices": {"local": "₹50", "foreigner": "₹200"}}}'::jsonb
    ) RETURNING id INTO hawa_mahal_id;

    -- Seed Images
    INSERT INTO public.location_images (location_id, image_url, alt_text) VALUES
    (city_palace_id, 'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop', 'Main view of City Palace Udaipur'),
    (city_palace_id, 'https://images.unsplash.com/photo-1603813693370-97495a2306a4?w=800&h=600&fit=crop', 'Mor Chowk or Peacock Courtyard'),
    (lake_pichola_id, 'https://images.unsplash.com/photo-1585333527582-1b3509352436?w=800&h=600&fit=crop', 'Boat on Lake Pichola at sunset');

END $$;
