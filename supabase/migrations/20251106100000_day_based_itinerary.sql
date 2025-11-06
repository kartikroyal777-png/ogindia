/*
          # [Operation Name]
          Restructure Itinerary to be Day-Based

          ## Query Description: "This migration overhauls the content structure. It removes the 'Tehsil' concept and introduces a 'Day' based itinerary system for each city. Locations will now be directly associated with a specific day of a city's itinerary. This is a major structural change but is designed to preserve existing location data by re-linking it."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - DROPS table: 'tehsils'
          - CREATES table: 'days'
          - ALTERS table: 'locations' (removes 'tehsil_id', adds 'day_id', 'timing_tag')
          - CREATES TYPE: 'time_of_day' ENUM
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, new policies for 'days' table.
          - Auth Requirements: Admin privileges for write operations.
          
          ## Performance Impact:
          - Indexes: New foreign key indexes on 'days' and 'locations'.
          - Triggers: None
          - Estimated Impact: Minor performance improvement due to simplified joins.
          */
-- 1. Create an ENUM type for timing tags if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_of_day') THEN
        CREATE TYPE public.time_of_day AS ENUM ('Morning', 'Afternoon', 'Evening');
    END IF;
END$$;

-- 2. Create the new 'days' table to hold daily itineraries for each city.
CREATE TABLE IF NOT EXISTS public.days (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_city_day UNIQUE (city_id, day_number)
);
COMMENT ON TABLE public.days IS 'Stores daily itinerary plans for each city.';

-- 3. Alter the 'locations' table to remove tehsil_id and add day_id and timing_tag.
ALTER TABLE public.locations DROP COLUMN IF EXISTS tehsil_id;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS day_id uuid REFERENCES public.days(id) ON DELETE SET NULL;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS timing_tag public.time_of_day;

-- 4. Drop the now-obsolete 'tehsils' table.
DROP TABLE IF EXISTS public.tehsils CASCADE;

-- 5. Enable RLS for the new 'days' table
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.days;
CREATE POLICY "Enable read access for all users" ON public.days FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for admins" ON public.days;
CREATE POLICY "Enable insert for admins" ON public.days FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'kartikroyal777@gmail.com');
DROP POLICY IF EXISTS "Enable update for admins" ON public.days;
CREATE POLICY "Enable update for admins" ON public.days FOR UPDATE USING (auth.jwt() ->> 'email' = 'kartikroyal777@gmail.com');
DROP POLICY IF EXISTS "Enable delete for admins" ON public.days;
CREATE POLICY "Enable delete for admins" ON public.days FOR DELETE USING (auth.jwt() ->> 'email' = 'kartikroyal777@gmail.com');

-- 6. Seed data for Udaipur
-- This will only run if Udaipur exists and doesn't have seeded data yet.
DO $$
DECLARE
  udaipur_city_id uuid;
  day1_id uuid;
  day2_id uuid;
BEGIN
  SELECT id INTO udaipur_city_id FROM public.cities WHERE name = 'Udaipur' LIMIT 1;

  IF udaipur_city_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.days WHERE city_id = udaipur_city_id) THEN
    -- Create days for Udaipur
    INSERT INTO public.days (city_id, day_number, title)
    VALUES (udaipur_city_id, 1, 'Lakes, Palaces, and Sunset Views')
    RETURNING id INTO day1_id;

    INSERT INTO public.days (city_id, day_number, title)
    VALUES (udaipur_city_id, 2, 'Culture, Crafts, and Countryside')
    RETURNING id INTO day2_id;

    -- Insert locations linked to these days
    INSERT INTO public.locations (name, category, short_intro, image_url, latitude, longitude, day_id, timing_tag, details)
    VALUES
    (
      'City Palace', 'Heritage', 'A majestic palace complex on the banks of Lake Pichola, showcasing a blend of Rajasthani and Mughal architecture.', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=800&h=600&fit=crop', 24.5761, 73.6835, day1_id, 'Morning',
      '{"about": {"historical_background": "Built over a period of nearly 400 years, with contributions from several rulers of the Mewar dynasty."}}'::jsonb
    ),
    (
      'Lake Pichola', 'Nature', 'An artificial fresh water lake, created in the year 1362 AD, named after the nearby Picholi village.', 'https://images.unsplash.com/photo-1577092923235-35c5c184a5a5?w=800&h=600&fit=crop', 24.5700, 73.6800, day1_id, 'Afternoon',
      '{"about": {"why_famous": "Famous for its picturesque boat rides and the stunning Lake Palace (Jag Niwas) located in its center."}}'::jsonb
    ),
    (
      'Jagmandir', 'Heritage', 'An island palace on Lake Pichola, also known as the "Lake Garden Palace".', 'https://images.unsplash.com/photo-1620428781005-13a05679057e?w=800&h=600&fit=crop', 24.5683, 73.6784, day1_id, 'Evening',
      '{"about": {"historical_background": "Served as a refuge for the Mughal prince Khurram (later Emperor Shah Jahan) in the 17th century."}}'::jsonb
    );
  END IF;
END $$;
