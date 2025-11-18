/*
# [Migration] Final Comprehensive Fix
This migration provides a complete and idempotent fix for all previous schema and seeding issues. It can be run multiple times without causing errors.

## Query Description:
This script overhauls database functions, triggers, and seeding logic to ensure stability and correctness. It drops and recreates objects in the correct order to resolve dependency conflicts. It also intelligently handles the creation of demo data (users, cities, popups) to prevent duplicate key errors.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Drops and recreates trigger: `on_popup_created_create_chat_group` on `city_popups`.
- Drops and recreates functions: `handle_new_popup_and_chat()`, `create_popup_with_chat(...)`.
- Ensures demo user and city exist before creating a demo popup.

## Security Implications:
- RLS Status: Unchanged.
- Policy Changes: No.
- Auth Requirements: The `create_popup_with_chat` function now correctly requires a `creator_id`.

## Performance Impact:
- Indexes: Unchanged.
- Triggers: Recreated for correctness.
- Estimated Impact: Low. Fixes runtime errors during data creation.
*/

DO $$
DECLARE
    alwar_city_id UUID;
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_popup_id UUID;
BEGIN
    -- Step 1: Drop dependent trigger and old functions if they exist, ignoring errors if they don't.
    DROP TRIGGER IF EXISTS on_popup_created_create_chat_group ON public.city_popups;
    DROP FUNCTION IF EXISTS public.handle_new_popup_and_chat();
    DROP FUNCTION IF EXISTS public.create_popup_with_chat(text, uuid, text, text, timestamptz, timestamptz, integer, text, boolean, boolean, numeric);

    -- Step 2: Create the function to handle new popups. This will be used by the trigger.
    CREATE OR REPLACE FUNCTION public.handle_new_popup_and_chat()
    RETURNS TRIGGER AS $$
    DECLARE
        new_group_id UUID;
    BEGIN
        -- Create a chat group for the new popup
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

    -- Step 3: Re-create the trigger on the city_popups table.
    CREATE TRIGGER on_popup_created_create_chat_group
    AFTER INSERT ON public.city_popups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_popup_and_chat();

    -- Step 4: Create the main function for creating a popup, now requiring a creator_id.
    CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
        p_creator_id UUID,
        p_title TEXT,
        p_city_id UUID,
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
        INSERT INTO public.city_popups (
            creator_id, title, city_id, description, destination, start_time, end_time, 
            max_attendees, gender_pref, allow_dating, allow_friendship, price
        )
        VALUES (
            p_creator_id, p_title, p_city_id, p_description, p_destination, p_start_time, p_end_time, 
            p_max_attendees, p_gender_preference, p_open_to_dating, p_open_to_friendship, p_price
        )
        RETURNING id INTO new_popup_id;

        RETURN new_popup_id;
    END;
    $$ LANGUAGE plpgsql;

    -- Step 5: Seed initial data idempotently.
    -- Ensure the demo user exists, but do nothing if the key already exists.
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (demo_user_id, 'Demo User', 'Demo User', 'https://i.pravatar.cc/150?u=00000000-0000-0000-0000-000000000001')
    ON CONFLICT (id) DO NOTHING;

    -- Ensure Alwar city exists and is marked as a stranger city.
    INSERT INTO public.cities (name, description, image_url, is_stranger_city)
    VALUES ('Alwar', 'A city of historic forts and lakes in Rajasthan.', 'https://images.unsplash.com/photo-1624551326435-0053c218a45a?q=80&w=1932&auto=format&fit=crop', TRUE)
    ON CONFLICT (name) DO UPDATE SET is_stranger_city = TRUE
    RETURNING id INTO alwar_city_id;

    -- Clean up any old demo popups in Alwar to prevent duplicates.
    DELETE FROM public.city_popups WHERE city_id = alwar_city_id AND creator_id = demo_user_id;

    -- Create a new demo popup for Alwar using the new function.
    SELECT public.create_popup_with_chat(
        demo_user_id,
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
        50.00
    ) INTO demo_popup_id;

END $$;
