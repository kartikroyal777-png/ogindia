-- This is a comprehensive and idempotent script to fix all outstanding schema issues.
-- It addresses the missing 'is_stranger_city' column, foreign key violations,
-- function dependencies, and seeding errors.

BEGIN;

-- =================================================================
-- Step 1: Fix the core schema issue - Add the missing column
-- This was the root cause of many previous failures.
-- =================================================================
/*
# [Operation Name]
Add is_stranger_city column to cities table

## Query Description: [This operation adds a new 'is_stranger_city' column to the 'cities' table to support the "Travel with Strangers" feature. It defaults to FALSE for existing cities. This is a non-destructive, structural change.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: public.cities
- Column Added: is_stranger_city (BOOLEAN, DEFAULT FALSE)
*/
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS is_stranger_city BOOLEAN DEFAULT FALSE;

-- =================================================================
-- Step 2: Clean up dependent objects from previous failed migrations
-- We drop the trigger first, then the function it depends on.
-- =================================================================
DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;
DROP FUNCTION IF EXISTS public.handle_new_popup();
DROP FUNCTION IF EXISTS public.create_popup_with_chat(text, uuid, uuid, text, text, timestamp with time zone, timestamp with time zone, integer, text, boolean, boolean, numeric);

-- =================================================================
-- Step 3: Recreate database functions and triggers correctly
-- =================================================================

-- Function to handle creating a chat group after a popup is inserted
/*
# [Operation Name]
Create function handle_new_popup

## Query Description: [This function is triggered after a new popup is created. It automatically creates a corresponding chat group and adds the popup's creator as the first member. This ensures every popup has a functional chat room from the start.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]
*/
CREATE OR REPLACE FUNCTION public.handle_new_popup()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create a chat group for the new popup
  INSERT INTO public.chat_groups (name, popup_id)
  VALUES (NEW.title, NEW.id)
  RETURNING id INTO new_group_id;

  -- Add the creator of the popup to the new chat group
  IF NEW.creator_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES (new_group_id, NEW.creator_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
/*
# [Operation Name]
Create trigger on_popup_created_create_chat_group

## Query Description: [This trigger automatically executes the 'handle_new_popup' function after a new record is inserted into the 'city_popups' table.]
*/
CREATE TRIGGER on_popup_created_create_chat_group
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_popup();

-- RPC function for the client to call
/*
# [Operation Name]
Create RPC function create_popup_with_chat

## Query Description: [This function provides a single, secure endpoint for clients to create a new popup. It takes all necessary details, inserts the popup record, and relies on the trigger to handle chat group creation.]
*/
CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
    p_title text,
    p_city_id uuid,
    p_creator_id uuid,
    p_description text,
    p_destination text,
    p_start_time timestamp with time zone,
    p_end_time timestamp with time zone,
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
    INSERT INTO public.city_popups (
        title, city_id, creator_id, description, destination, start_time, end_time,
        max_attendees, gender_pref, allow_dating, allow_friendship, price
    )
    VALUES (
        p_title, p_city_id, p_creator_id, p_description, p_destination, p_start_time, p_end_time,
        p_max_attendees, p_gender_preference, p_open_to_dating, p_open_to_friendship, p_price
    )
    RETURNING id INTO new_popup_id;

    RETURN new_popup_id;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- Step 4: Idempotently seed required data
-- =================================================================
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    alwar_city_id UUID;
BEGIN
    -- 1. Create the demo user in auth.users if it doesn't exist
    -- This fixes the foreign key violation error.
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, role)
        VALUES (demo_user_id, 'demo@example.com', crypt('password123', gen_salt('bf')), 'authenticated');
    END IF;

    -- 2. Create the corresponding profile if it doesn't exist
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (demo_user_id, 'demo_user', 'Demo User', 'https://i.pravatar.cc/150?u=demo_user')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create or update Alwar city and mark it as a stranger city
    -- This fixes the "column does not exist" error.
    INSERT INTO public.cities (name, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a', TRUE)
    ON CONFLICT (name) DO UPDATE SET is_stranger_city = TRUE
    RETURNING id INTO alwar_city_id;

    -- 4. Create a demo popup in Alwar for the demo user, if it doesn't exist
    IF alwar_city_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.city_popups WHERE title = 'Alwar Fort Exploration') THEN
        PERFORM public.create_popup_with_chat(
            'Alwar Fort Exploration',
            alwar_city_id,
            demo_user_id, -- Pass the creator ID
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

END;
$$;

COMMIT;
