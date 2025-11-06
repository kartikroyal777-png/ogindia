/*
  # [Data] Add Demo Community Popups
  This operation seeds the `city_popups` table with three sample records to demonstrate the "Travel with Stranger" feature.

  ## Query Description: 
  This script safely inserts three demo popups into the `city_popups` table. It first finds an existing user to act as the creator. If no users are found, it does nothing. It uses `ON CONFLICT DO NOTHING` to prevent duplicate entries if the script is run multiple times. This operation is safe and will not affect existing data.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Tables affected: `public.city_popups` (INSERT)
  
  ## Security Implications:
  - RLS Status: Assumes RLS is enabled on `city_popups`.
  - Policy Changes: No
  - Auth Requirements: An authenticated user must exist in `auth.users` for the script to run.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Select the ID of any user to act as the creator for demo data.
    -- If no users exist, this will be NULL and the inserts will be skipped.
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

    IF demo_user_id IS NOT NULL THEN
        -- Insert a demo "Photo Walk" popup
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
        ) ON CONFLICT (id) DO NOTHING;

        -- Insert a demo "Dinner" popup
        INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
        VALUES (
            demo_user_id,
            'Connaught Place, Delhi',
            now() + interval '2 days',
            4,
            'Dinner',
            'Exploring the food scene in CP. Join me for some delicious North Indian cuisine at a classic restaurant. Open to suggestions!',
            'all',
            true,
            true,
            'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
            now() + interval '2 days' + interval '8 hours'
        ) ON CONFLICT (id) DO NOTHING;

        -- Insert a demo "Trip" popup
        INSERT INTO public.city_popups (creator_id, destination, start_time, seats_available, type, description, gender_pref, allow_friendship, allow_dating, image_url, expires_at)
        VALUES (
            demo_user_id,
            'Rishikesh River Rafting',
            now() + interval '5 days',
            2,
            'Trip',
            'Planning a weekend trip to Rishikesh for some white water rafting. Looking for one or two people to join and share the costs.',
            'all',
            true,
            false,
            'https://images.unsplash.com/photo-1609839446975-d1d478b54b03?w=400&h=300&fit=crop',
            now() + interval '5 days' + interval '8 hours'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
