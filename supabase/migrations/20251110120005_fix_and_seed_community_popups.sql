-- This script ensures the city_popups table is correctly structured before seeding demo data.
-- It is idempotent and can be run safely multiple times.

BEGIN;

/*
  # [Operation Name]
  Ensure and Seed Community Popups Table

  ## Query Description: 
  This script first ensures that the `city_popups` table exists and has all the required columns. It adds any missing columns to prevent errors in partially migrated databases. After verifying the schema, it inserts three demo "popup" events for the community feature, but only if they don't already exist. This operation is safe to run as it will not duplicate data or alter existing data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (manually)
  
  ## Structure Details:
  - Affects table: `public.city_popups`
  - Adds columns if missing: `seats_available`, `type`, `gender_pref`, `allow_dating`, `allow_friendship`, `verified_only`, `image_url`, `expires_at`
  - Inserts up to 3 new rows for demo purposes.
  
  ## Security Implications:
  - RLS Status: Unchanged.
  - Policy Changes: No.
  - Auth Requirements: No.
  
  ## Performance Impact:
  - Indexes: None.
  - Triggers: None.
  - Estimated Impact: Negligible.
*/

-- Step 1: Ensure the table and all columns exist.
CREATE TABLE IF NOT EXISTS public.city_popups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
    destination text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    seats_available integer DEFAULT 1,
    price numeric,
    type text,
    description text,
    gender_pref text DEFAULT 'all',
    allow_dating boolean DEFAULT false,
    allow_friendship boolean DEFAULT true,
    verified_only boolean DEFAULT false,
    image_url text,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='seats_available') THEN
        ALTER TABLE public.city_popups ADD COLUMN seats_available integer DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='type') THEN
        ALTER TABLE public.city_popups ADD COLUMN type text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='gender_pref') THEN
        ALTER TABLE public.city_popups ADD COLUMN gender_pref text DEFAULT 'all';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='allow_dating') THEN
        ALTER TABLE public.city_popups ADD COLUMN allow_dating boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='allow_friendship') THEN
        ALTER TABLE public.city_popups ADD COLUMN allow_friendship boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='verified_only') THEN
        ALTER TABLE public.city_popups ADD COLUMN verified_only boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='image_url') THEN
        ALTER TABLE public.city_popups ADD COLUMN image_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='expires_at') THEN
        ALTER TABLE public.city_popups ADD COLUMN expires_at timestamptz;
    END IF;
END;
$$;

-- Step 2: Seed data only after schema is confirmed.
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Find a demo user to assign the popups to.
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

    IF demo_user_id IS NOT NULL THEN
        -- Seed Hawa Mahal Photo Walk
        IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Hawa Mahal, Jaipur' AND type = 'Photo Walk') THEN
            INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
            VALUES (
                demo_user_id,
                'Hawa Mahal, Jaipur',
                now() + interval '1 day',
                3,
                'Photo Walk',
                'Let''s capture the morning light at the iconic Hawa Mahal. All levels of photographers are welcome, from phone cameras to DSLRs!',
                'all',
                true,
                false,
                'https://images.unsplash.com/photo-1599661046289-e31897846364?w=400&h=300&fit=crop',
                now() + interval '1 day' + interval '8 hours'
            );
        END IF;

        -- Seed Udaipur Food Tour
        IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Old City, Udaipur' AND type = 'Food Tour') THEN
            INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
            VALUES (
                demo_user_id,
                'Old City, Udaipur',
                now() + interval '2 days',
                5,
                'Food Tour',
                'Join me to explore the best street food Udaipur has to offer. We''ll try everything from kachori to jalebi. Come hungry!',
                'all',
                true,
                true,
                'https://images.unsplash.com/photo-1617021428453-85755195b65f?w=400&h=300&fit=crop',
                now() + interval '2 days' + interval '8 hours'
            );
        END IF;

        -- Seed Goa Beach Meetup
        IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Anjuna Beach, Goa' AND type = 'Meetup') THEN
            INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
            VALUES (
                demo_user_id,
                'Anjuna Beach, Goa',
                now() + interval '5 days',
                10,
                'Meetup',
                'Sunset meetup at Anjuna Beach. Let''s chill, listen to some music, and meet other travelers. Find us near Curlies.',
                'all',
                true,
                true,
                'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop',
                now() + interval '5 days' + interval '8 hours'
            );
        END IF;
    END IF;
END;
$$;

COMMIT;
