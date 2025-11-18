/*
# [Operation Name]
Comprehensive Schema Fix and Feature Implementation

## Query Description: [This migration provides a comprehensive fix for popup creation, chat group association, and admin features. It resolves a critical dependency error from the previous migration by correctly dropping and recreating triggers and functions. It makes the seeding script for the 'Alwar' demo popup robust by assigning a valid creator ID, preventing null constraint violations. This operation is designed to be idempotent and safe to re-run.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Drops and recreates the 'handle_new_popup' function and its associated trigger 'on_popup_created_create_chat_group'.
- Drops and recreates the 'create_popup_with_chat' function to correctly handle creator IDs.
- Cleans up and re-seeds the 'Alwar' city and a demo popup.
- Ensures 'city_popups' and 'chat_groups' are correctly linked.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: The seeding script now correctly fetches an authenticated user ID.

## Performance Impact:
- Indexes: None
- Triggers: Modified
- Estimated Impact: Low. The changes primarily affect the creation of new popups.
*/

-- Step 1: Drop dependent objects in the correct order using CASCADE for safety.
DROP FUNCTION IF EXISTS public.create_popup_with_chat(text,uuid,text,text,timestamp with time zone,timestamp with time zone,integer,text,boolean,boolean,numeric,uuid) CASCADE;
DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;
DROP FUNCTION IF EXISTS public.handle_new_popup() CASCADE;

-- Step 2: Recreate the function that the trigger will call.
-- This function creates a chat group and adds the popup creator as the first member.
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

-- Step 4: Recreate the main RPC function to create a popup.
-- It now requires a creator_id to be passed explicitly.
CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
    p_title text,
    p_city_id uuid,
    p_description text,
    p_destination text,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_max_attendees integer,
    p_gender_preference text,
    p_open_to_dating boolean,
    p_open_to_friendship boolean,
    p_price numeric,
    p_creator_id uuid
)
RETURNS uuid AS $$
DECLARE
    new_popup_id uuid;
BEGIN
    INSERT INTO public.city_popups (
        title, city_id, description, destination, start_time, end_time, 
        max_attendees, gender_pref, allow_dating, allow_friendship, price, creator_id
    )
    VALUES (
        p_title, p_city_id, p_description, p_destination, p_start_time, p_end_time, 
        p_max_attendees, p_gender_preference, p_open_to_dating, p_open_to_friendship, p_price, p_creator_id
    )
    RETURNING id INTO new_popup_id;

    RETURN new_popup_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Seed demo data idempotently.
DO $$
DECLARE
    alwar_city_id UUID;
    demo_user_id UUID;
BEGIN
    -- Ensure the 'Alwar' city exists and get its ID.
    INSERT INTO public.cities (name, country, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'India', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a', TRUE)
    ON CONFLICT (name) DO UPDATE SET is_stranger_city = TRUE
    RETURNING id INTO alwar_city_id;

    -- Get a valid user ID to act as the creator of the demo popup.
    -- This is critical to prevent the not-null violation.
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

    -- If a user exists, create a demo popup for Alwar.
    IF demo_user_id IS NOT NULL THEN
        -- First, delete any existing demo popup with the same title to avoid conflicts.
        DELETE FROM public.city_popups WHERE title = 'Alwar Fort Exploration' AND city_id = alwar_city_id;

        -- Create the new demo popup using the updated function.
        PERFORM public.create_popup_with_chat(
            'Alwar Fort Exploration',
            alwar_city_id,
            'Lets explore the historic Alwar Fort and enjoy the city views. Meeting at the main gate.',
            'Alwar Fort',
            now() + interval '1 day',
            now() + interval '1 day 4 hours',
            8,
            'any',
            false,
            true,
            50.00,
            demo_user_id
        );
    END IF;
END $$;
