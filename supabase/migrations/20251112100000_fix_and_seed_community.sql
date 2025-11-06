/*
# [Fix] Correct Community Schema and Seed Data
This script corrects the schema for the `city_popups` table by ensuring all necessary columns exist before attempting to seed it with demo data. This resolves the "column does not exist" error from the previous migration.

## Query Description:
This operation first adds the `seats_available`, `image_url`, and `expires_at` columns to the `city_popups` table if they are missing. It then inserts several demo community popups to populate the feature for testing and demonstration. This script is safe to re-run, as it checks for the existence of columns before adding them.

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true
*/

-- Step 1: Ensure all required columns exist in the city_popups table.
-- This must run before the data seeding block to prevent "column does not exist" errors.
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS seats_available INTEGER;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Step 2: Seed the city_popups table with demo data.
-- This block finds or creates a demo user and then inserts popups.
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Find an existing user to act as the creator.
    -- We'll just pick the first user found in the auth table.
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

    -- If no users exist, we cannot create popups. This is a safeguard.
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users. Skipping city_popups seeding.';
        RETURN;
    END IF;

    -- Insert demo popups.
    -- To prevent duplicates, we check if a similar popup already exists.
    -- This is a simple check based on destination and type for demo purposes.

    -- Popup 1: Photo Walk in Jaipur
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

    -- Popup 2: Trip in Udaipur
    IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'City Palace, Udaipur' AND type = 'Trip') THEN
        INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
        VALUES (
            demo_user_id,
            'City Palace, Udaipur',
            now() + interval '2 days',
            4,
            'Trip',
            'Exploring the grand City Palace of Udaipur. We can share a guide to save on costs. Meet at the main entrance.',
            'all',
            true,
            false,
            'https://images.unsplash.com/photo-1615836245337-f5e9b2303f10?w=400&h=300&fit=crop',
            now() + interval '2 days' + interval '8 hours'
        );
    END IF;

    -- Popup 3: Food Tour in Delhi
    IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Local Food Tour, Delhi' AND type = 'Dinner') THEN
        INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
        VALUES (
            demo_user_id,
            'Local Food Tour, Delhi',
            now() + interval '3 days',
            5,
            'Dinner',
            'Street food adventure in Old Delhi! Looking for fellow foodies to try out some famous local delicacies. Shared costs.',
            'all',
            true,
            true,
            'https://images.unsplash.com/photo-1606491048802-8342506d844a?w=400&h=300&fit=crop',
            now() + interval '3 days' + interval '8 hours'
        );
    END IF;

    -- Popup 4: Yoga in Rishikesh
    IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE destination = 'Yoga by the Ganges, Rishikesh' AND type = 'Meetup') THEN
        INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
        VALUES (
            demo_user_id,
            'Yoga by the Ganges, Rishikesh',
            now() + interval '5 days',
            10,
            'Meetup',
            'Morning yoga session by the river. A peaceful start to the day. Open to everyone, no experience needed.',
            'all',
            true,
            false,
            'https://images.unsplash.com/photo-1597200388933-966a07f6a7f4?w=400&h=300&fit=crop',
            now() + interval '5 days' + interval '8 hours'
        );
    END IF;

END $$;
