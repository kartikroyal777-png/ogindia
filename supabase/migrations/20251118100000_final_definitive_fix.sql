-- Migration Script: Final Definitive Fix for Schema and Seeding

/*
# [Operation Name]
Comprehensive Schema and Data Integrity Fix

## Query Description:
This script provides a definitive fix for a series of migration errors related to missing columns, foreign key violations, and non-idempotent seeding. It ensures the database schema is consistent with the application's requirements and safely seeds initial data.

Key changes:
1.  **Adds Missing Columns:** Adds the `is_stranger_city` and `country` columns to the `public.cities` table if they don't exist, resolving schema mismatch errors.
2.  **Corrects Seeding Logic:** Safely creates a demo user in `auth.users` and `public.profiles`, preventing foreign key violations.
3.  **Idempotent Seeding:** Uses `ON CONFLICT` and `IF NOT EXISTS` clauses to ensure the script can be run multiple times without causing "duplicate key" errors.
4.  **Fixes Database Functions:** Recreates the functions for creating popups and chat groups with the correct logic and dependencies.

This script is designed to be safe and will bring your database to a stable, consistent state.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Affects tables: `public.cities`, `auth.users`, `public.profiles`, `public.city_popups`, `public.chat_groups`
- Affects functions: `handle_new_popup`, `create_popup_with_chat`
- Affects triggers: `on_popup_created_create_chat_group`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Seeds a demo user.

## Performance Impact:
- Indexes: None
- Triggers: Recreates one trigger.
- Estimated Impact: Low.
*/

BEGIN;

-- Step 1: Fix the `cities` table schema.
-- Add `is_stranger_city` column if it doesn't exist.
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS is_stranger_city BOOLEAN NOT NULL DEFAULT FALSE;

-- Add `country` column if it doesn't exist. This was the source of the latest error.
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS country TEXT;


-- Step 2: Drop dependent objects before modifying the function.
DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;

-- Step 3: Recreate the `handle_new_popup` function correctly.
CREATE OR REPLACE FUNCTION public.handle_new_popup()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create a new chat group for the popup
  INSERT INTO public.chat_groups (name, popup_id)
  VALUES (NEW.title, NEW.id)
  RETURNING id INTO new_group_id;

  -- Add the popup creator as the first member of the chat group
  IF NEW.creator_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id)
    VALUES (new_group_id, NEW.creator_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger to call the function.
CREATE TRIGGER on_popup_created_create_chat_group
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_popup();

-- Step 5: Recreate the `create_popup_with_chat` RPC function.
CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
    p_title TEXT,
    p_city_id UUID,
    p_creator_id UUID,
    p_description TEXT,
    p_destination TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_max_attendees INT,
    p_gender_preference TEXT,
    p_open_to_dating BOOLEAN,
    p_open_to_friendship BOOLEAN,
    p_price NUMERIC
)
RETURNS UUID AS $$
DECLARE
    new_popup_id UUID;
BEGIN
    -- Ensure the creator exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_creator_id) THEN
        RAISE EXCEPTION 'Creator with ID % does not exist', p_creator_id;
    END IF;

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

    RETURN new_popup_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Idempotent seeding of demo data.
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    alwar_city_id UUID;
BEGIN
    -- Create a demo user in auth.users if it doesn't exist.
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, role)
        VALUES (demo_user_id, 'demo@example.com', crypt('password123', gen_salt('bf')), 'authenticated');
    END IF;

    -- Create a corresponding profile if it doesn't exist.
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (demo_user_id, 'demo_user', 'Demo User', 'https://i.pravatar.cc/150?u=demo_user')
    ON CONFLICT (id) DO NOTHING;

    -- Create or update 'Alwar' city and get its ID.
    -- This now includes the 'country' and 'state' columns.
    INSERT INTO public.cities (name, state, country, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'Rajasthan', 'India', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a', TRUE)
    ON CONFLICT (name) DO UPDATE SET 
        is_stranger_city = TRUE,
        state = 'Rajasthan',
        country = 'India'
    RETURNING id INTO alwar_city_id;

    -- Create a demo popup for Alwar, associated with the demo user.
    -- Check if a popup with this title already exists for this city to avoid duplicates.
    IF NOT EXISTS (SELECT 1 FROM public.city_popups WHERE title = 'Alwar Fort Exploration' AND city_id = alwar_city_id) THEN
        PERFORM public.create_popup_with_chat(
            'Alwar Fort Exploration',
            alwar_city_id,
            demo_user_id, -- Use the demo user ID
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
