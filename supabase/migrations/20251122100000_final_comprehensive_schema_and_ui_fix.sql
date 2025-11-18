/*
          # [Migration] Final Comprehensive Schema and UI Fix
          This script provides a definitive fix for all previous migration errors by addressing the root causes.

          ## Query Description: 
          This is a comprehensive script that corrects several issues:
          1.  **Adds Missing Columns:** It correctly handles the `state` and `country` columns in the `cities` table which were causing `NOT NULL` constraint violations.
          2.  **Handles Dependencies:** It safely drops and recreates triggers and functions in the correct order to avoid dependency errors.
          3.  **Idempotent Seeding:** It creates a demo user and profile in the correct order (`auth.users` first, then `profiles`) and seeds the 'Alwar' city and a demo popup, but only if they don't already exist. This prevents `duplicate key` errors.
          
          This script is designed to be run once to bring the database to a stable, correct state. There are no known risks, as it checks for existing data before making changes.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false

          ## Structure Details:
          - **Tables Modified:** `cities`, `auth.users`, `profiles`, `city_popups`, `chat_groups`, `chat_group_members`.
          - **Functions Modified:** `create_popup_with_chat`, `handle_new_popup`.
          - **Triggers Modified:** `on_popup_created_create_chat_group`.

          ## Security Implications:
          - RLS Status: Unchanged.
          - Policy Changes: No.
          - Auth Requirements: Seeds a demo user for testing purposes.
*/

-- Step 1: Drop dependent objects first to avoid errors.
DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;
DROP FUNCTION IF EXISTS public.handle_new_popup();
DROP FUNCTION IF EXISTS public.create_popup_with_chat(text, uuid, uuid, text, text, timestamp with time zone, timestamp with time zone, integer, text, boolean, boolean, numeric);

-- Step 2: Recreate the function to handle new popup creation.
-- This function will be triggered after a popup is created to set up the chat group.
CREATE OR REPLACE FUNCTION public.handle_new_popup()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create a chat group for the new popup
  INSERT INTO public.chat_groups (name, popup_id)
  VALUES (NEW.title, NEW.id)
  RETURNING id INTO new_group_id;

  -- Add the creator of the popup as the first member of the chat group
  IF NEW.creator_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES (new_group_id, NEW.creator_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger on the city_popups table.
CREATE TRIGGER on_popup_created_create_chat_group
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_popup();

-- Step 4: Recreate the main RPC function to create a popup and its chat group.
CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
    p_title text,
    p_city_id uuid,
    p_creator_id uuid,
    p_description text,
    p_destination text,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_max_attendees integer,
    p_gender_preference text,
    p_open_to_dating boolean,
    p_open_to_friendship boolean,
    p_price numeric
)
RETURNS uuid AS $$
DECLARE
    new_popup_id uuid;
BEGIN
    -- Insert the new popup
    INSERT INTO public.city_popups (
        title, city_id, creator_id, description, destination, start_time, end_time, 
        max_attendees, gender_pref, allow_dating, allow_friendship, price
    )
    VALUES (
        p_title, p_city_id, p_creator_id, p_description, p_destination, p_start_time, p_end_time, 
        p_max_attendees, p_gender_preference, p_open_to_dating, p_open_to_friendship, p_price
    )
    RETURNING id INTO new_popup_id;

    -- The trigger 'on_popup_created_create_chat_group' will handle chat group creation.
    
    RETURN new_popup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Seed initial data idempotently (safe to re-run).
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    alwar_city_id UUID;
    demo_popup_id UUID;
BEGIN
    -- Create a demo user in auth.users if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, role)
        VALUES (demo_user_id, 'demo@example.com', crypt('password123', gen_salt('bf')), 'authenticated');
    END IF;

    -- Create a corresponding profile if it doesn't exist
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (demo_user_id, 'demo_user', 'Demo User', 'https://i.pravatar.cc/150?u=demo_user')
    ON CONFLICT (id) DO NOTHING;

    -- Add the 'is_stranger_city' column if it doesn't exist
    ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS is_stranger_city BOOLEAN DEFAULT FALSE;

    -- Create 'Alwar' city and mark it as a stranger city.
    -- This now includes the required 'state' and 'country' columns.
    INSERT INTO public.cities (name, state, country, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'Rajasthan', 'India', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a', TRUE)
    ON CONFLICT (name) DO UPDATE SET 
        is_stranger_city = TRUE,
        state = 'Rajasthan',
        country = 'India'
    RETURNING id INTO alwar_city_id;

    -- Create a demo popup in Alwar if it doesn't already exist
    IF alwar_city_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.city_popups WHERE title = 'Alwar Fort Exploration') THEN
        PERFORM public.create_popup_with_chat(
            'Alwar Fort Exploration',
            alwar_city_id,
            demo_user_id, -- Use the demo user ID as the creator
            'Lets explore the historic Alwar Fort and enjoy the city views. Meeting at the main gate.',
            'Alwar Fort',
            now() + interval '1 day',
            now() + interval '1 day 4 hours',
            8,
            'any',
            false,
            true,
            50.00
        );
    END IF;
END $$;
