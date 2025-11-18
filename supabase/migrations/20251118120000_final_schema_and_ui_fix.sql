/*
          # [Operation Name]
          Comprehensive Schema and Seeding Fix

          ## Query Description: [This migration provides a comprehensive fix for previous migration failures. It addresses dependency issues with triggers and functions, corrects schema mismatches during data seeding, and ensures the database is in a consistent state for the "Travel with Stranger" feature. It is designed to be idempotent, meaning it can be run multiple times without causing errors.]

          ## Metadata:
          - Schema-Category: ["Structural", "Data"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]

          ## Structure Details:
          - Drops and recreates the `on_popup_created_create_chat_group` trigger.
          - Drops and recreates the `handle_new_popup_and_chat_group` function.
          - Drops and recreates the `create_popup_with_chat` function.
          - Corrects the seeding logic for the 'Alwar' city to match the existing `cities` table schema.
          - Seeds a demo popup in Alwar.

          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [The seeding script requires a valid user from `auth.users` to act as the creator of the demo popup.]

          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [Modified]
          - Estimated Impact: [Low. This is a one-time structural and data seeding operation.]
          */

-- Step 1: Drop dependent objects in the correct order to avoid errors.
DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;
DROP FUNCTION IF EXISTS public.handle_new_popup_and_chat_group();
DROP FUNCTION IF EXISTS public.create_popup_with_chat(text,uuid,text,text,timestamp with time zone,timestamp with time zone,integer,text,boolean,boolean,numeric,uuid);

-- Step 2: Create the new function to create a popup and chat group, now requiring a creator_id.
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_popup_id uuid;
BEGIN
    -- Insert the new popup and pass the creator_id directly
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
$$;

-- Step 3: Create the trigger function that will create the chat group and add the creator as a member.
CREATE OR REPLACE FUNCTION public.handle_new_popup_and_chat_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_group_id uuid;
BEGIN
    -- Create a chat group for the new popup
    INSERT INTO public.chat_groups (name, popup_id)
    VALUES (NEW.title, NEW.id)
    RETURNING id INTO new_group_id;

    -- Add the popup creator as the first member of the chat group
    -- This now correctly references NEW.creator_id which is guaranteed by the create_popup_with_chat function
    IF NEW.creator_id IS NOT NULL THEN
        INSERT INTO public.chat_group_members (group_id, user_id)
        VALUES (new_group_id, NEW.creator_id);
    END IF;

    RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger on the city_popups table.
CREATE TRIGGER on_popup_created_create_chat_group
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_popup_and_chat_group();

-- Step 5: Seed the "Alwar" city and a demo popup.
DO $$
DECLARE
    alwar_city_id uuid;
    demo_user_id uuid;
BEGIN
    -- Ensure a demo user exists to be the creator of the popup.
    -- This uses a fixed UUID for idempotency.
    demo_user_id := '00000000-0000-0000-0000-000000000001';
    
    -- Create a dummy user if it doesn't exist for seeding purposes.
    -- In a real scenario, you'd pick a real admin/test user.
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, role)
        VALUES (demo_user_id, 'demo@example.com', 'dummy-password', 'authenticated');
        
        INSERT INTO public.profiles (id, username, full_name)
        VALUES (demo_user_id, 'Demo User', 'Demo User');
    END IF;

    -- Correctly insert 'Alwar' without the 'country' column.
    -- Use ON CONFLICT to avoid errors on re-runs.
    INSERT INTO public.cities (name, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a', TRUE)
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        is_stranger_city = TRUE
    RETURNING id INTO alwar_city_id;

    -- Delete any existing demo popup to prevent duplicates on re-runs.
    DELETE FROM public.city_popups WHERE title = 'Alwar Fort Exploration';

    -- Create the demo popup using the new function and the demo user ID.
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
END $$;
