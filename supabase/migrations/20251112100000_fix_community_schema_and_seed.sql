/*
# [Fix] Correct Community Schema and Seed Demo Data
[This script ensures the 'city_popups' table has all required columns before seeding it with demo data. It fixes an error where the 'type' column was referenced before it existed.]

## Query Description: [This operation safely adds missing columns ('type', 'price', 'image_url', 'expires_at') to the 'city_popups' table. It then inserts several demo "popups" for cities like Jaipur and Udaipur to make the Community feature functional. The script is idempotent, meaning it can be run multiple times without causing errors or creating duplicate data.]

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables affected: public.city_popups
- Columns added (if not exist): type, price, image_url, expires_at
- Data inserted: Demo popups for the community page.

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [Admin privileges to alter table structure]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. Adds a few columns and rows to a table.]
*/

DO $$
BEGIN
    -- Add 'type' column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='type') THEN
        ALTER TABLE public.city_popups ADD COLUMN type text;
    END IF;

    -- Add 'price' column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='price') THEN
        ALTER TABLE public.city_popups ADD COLUMN price numeric;
    END IF;

    -- Add 'image_url' column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='image_url') THEN
        ALTER TABLE public.city_popups ADD COLUMN image_url text;
    END IF;

    -- Add 'expires_at' column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='expires_at') THEN
        ALTER TABLE public.city_popups ADD COLUMN expires_at timestamptz;
    END IF;
END;
$$;


-- Seed demo data into the city_popups table
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Find a user to be the creator. If no users exist, this will do nothing.
    -- We'll try to find the user associated with the admin email.
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'kartikroyal777@gmail.com' LIMIT 1;

    -- If admin user doesn't exist, try to get any user.
    IF demo_user_id IS NULL THEN
        SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
    END IF;

    -- Only proceed if we found a user ID
    IF demo_user_id IS NOT NULL THEN
        -- Demo Popup 1: Photo Walk in Jaipur
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

        -- Demo Popup 2: Food Tour in Udaipur
        IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Old City, Udaipur' AND type = 'Dinner') THEN
            INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
            VALUES (
                demo_user_id,
                'Old City, Udaipur',
                now() + interval '2 days',
                4,
                'Dinner',
                'Exploring the best street food and rooftop restaurants in Udaipur''s old city. Join me for a culinary adventure!',
                'all',
                true,
                true,
                'https://images.unsplash.com/photo-1576487244885-b5195cf65215?w=400&h=300&fit=crop',
                now() + interval '2 days' + interval '8 hours'
            );
        END IF;

        -- Demo Popup 3: Temple Visit in Delhi
        IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Lotus Temple, Delhi' AND type = 'Temple Visit') THEN
            INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
            VALUES (
                demo_user_id,
                'Lotus Temple, Delhi',
                now() + interval '3 days',
                2,
                'Temple Visit',
                'A peaceful visit to the beautiful Lotus Temple. Looking for company for a quiet and reflective afternoon.',
                'females_only',
                true,
                false,
                'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
                now() + interval '3 days' + interval '8 hours'
            );
        END IF;
    END IF;
END;
$$;
