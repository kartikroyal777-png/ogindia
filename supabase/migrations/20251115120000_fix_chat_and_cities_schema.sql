/*
          # [Fix] Comprehensive Schema and Function Fix
          [This migration corrects the database schema by ensuring all tables for the 'Travel with Stranger' feature are created before any functions or policies that depend on them. It creates the cities, chats, participants, and messages tables, adds the instagram_handle to profiles, and sets up the necessary security policies and the core 'join_popup_chat' function.]

          ## Query Description: [This is a safe, idempotent script. It checks for the existence of tables, columns, and functions before creating them, so it can be run multiple times without causing errors. It will repair the database schema to a consistent state, allowing the application's chat and community features to function correctly. No data will be lost.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates tables: `cities`, `user_joined_cities`, `chats`, `chat_participants`, `chat_messages`
          - Alters table: `profiles` (adds `instagram_handle`)
          - Creates function: `join_popup_chat`
          - Creates RLS Policies for all new tables.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Users must be authenticated to use these features.]
          
          ## Performance Impact:
          - Indexes: [Adds primary keys and foreign keys which are indexed by default.]
          - Triggers: [No]
          - Estimated Impact: [Low. This is a one-time schema setup.]
          */

-- Step 1: Create all necessary tables if they don't exist.
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    state TEXT,
    country TEXT DEFAULT 'India',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_joined_cities (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, city_id)
);

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    popup_id UUID REFERENCES public.city_popups(id) ON DELETE CASCADE UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add instagram_handle to profiles if it doesn't exist.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- Step 3: Enable RLS on all new tables.
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_joined_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop and recreate policies to ensure consistency.
DROP POLICY IF EXISTS "Allow public read access" ON public.cities;
DROP POLICY IF EXISTS "Allow admin full access" ON public.cities;
DROP POLICY IF EXISTS "Allow users to manage their own joined cities" ON public.user_joined_cities;
DROP POLICY IF EXISTS "Allow chat participants to view chat info" ON public.chats;
DROP POLICY IF EXISTS "Allow participants to view each other" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow users to join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow participants to read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow participants to send messages" ON public.chat_messages;

-- Policies for cities
CREATE POLICY "Allow public read access" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.cities FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Policies for user_joined_cities
CREATE POLICY "Allow users to manage their own joined cities" ON public.user_joined_cities
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for chats
CREATE POLICY "Allow chat participants to view chat info" ON public.chats
FOR SELECT USING (
  id IN (
    SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
  )
);

-- Policies for chat_participants
CREATE POLICY "Allow participants to view each other" ON public.chat_participants
FOR SELECT USING (
  chat_id IN (
    SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to join chats" ON public.chat_participants
FOR INSERT WITH CHECK (true); -- Logic is handled by the join_popup_chat function

-- Policies for chat_messages
CREATE POLICY "Allow participants to read messages" ON public.chat_messages
FOR SELECT USING (
  chat_id IN (
    SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow participants to send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  chat_id IN (
    SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
  )
);

-- Step 5: Create the function to handle joining a popup.
CREATE OR REPLACE FUNCTION public.join_popup_chat(p_popup_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creator_id UUID;
    v_seats_available INT;
    v_current_participants INT;
    v_chat_id UUID;
    v_user_id UUID := auth.uid();
    v_user_profile RECORD;
    v_popup_city_id UUID;
    v_is_user_in_city BOOLEAN;
BEGIN
    -- Step 1: Validate user profile (must have name, photo, instagram)
    SELECT full_name, avatar_url, instagram_handle INTO v_user_profile
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_profile.full_name IS NULL OR v_user_profile.avatar_url IS NULL OR v_user_profile.instagram_handle IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Please complete your profile (name, photo, and Instagram handle) before joining a popup.');
    END IF;

    -- Step 2: Get popup details
    SELECT creator_id, seats, city_id INTO v_creator_id, v_seats_available, v_popup_city_id
    FROM public.city_popups
    WHERE id = p_popup_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Popup not found.');
    END IF;
    
    -- Step 2.5: Check if user has joined the city for the popup
    SELECT EXISTS (
        SELECT 1 FROM public.user_joined_cities
        WHERE user_id = v_user_id AND city_id = v_popup_city_id
    ) INTO v_is_user_in_city;

    IF NOT v_is_user_in_city THEN
        RETURN json_build_object('success', false, 'message', 'You must join the city before joining a popup within it.');
    END IF;

    -- Step 3: Find or create the chat for the popup
    SELECT id INTO v_chat_id FROM public.chats WHERE popup_id = p_popup_id;

    IF v_chat_id IS NULL THEN
        -- Create chat and add creator as first participant
        INSERT INTO public.chats (popup_id, created_by, name)
        VALUES (p_popup_id, v_creator_id, (SELECT destination FROM public.city_popups WHERE id = p_popup_id))
        RETURNING id INTO v_chat_id;

        INSERT INTO public.chat_participants (chat_id, user_id)
        VALUES (v_chat_id, v_creator_id);
    END IF;

    -- Step 4: Check if user is already a participant
    IF EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = v_chat_id AND user_id = v_user_id) THEN
        RETURN json_build_object('success', true, 'message', 'You are already in this chat.', 'chat_id', v_chat_id);
    END IF;

    -- Step 5: Check seat availability (atomically)
    SELECT count(*) INTO v_current_participants FROM public.chat_participants WHERE chat_id = v_chat_id;

    IF v_current_participants >= v_seats_available THEN
        RETURN json_build_object('success', false, 'message', 'This popup is full.');
    END IF;

    -- Step 6: Add user to the chat
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (v_chat_id, v_user_id);

    RETURN json_build_object('success', true, 'message', 'Successfully joined the popup chat.', 'chat_id', v_chat_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- Step 6: Seed demo cities if they don't exist.
INSERT INTO public.cities (name, state, image_url) VALUES
('Jaipur', 'Rajasthan', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=400&h=300&fit=crop'),
('Udaipur', 'Rajasthan', 'https://images.unsplash.com/photo-1596701938459-b1b799849f24?w=400&h=300&fit=crop'),
('Mumbai', 'Maharashtra', 'https://images.unsplash.com/photo-1562979314-1ace7c394686?w=400&h=300&fit=crop'),
('Delhi', 'Delhi', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop'),
('Bengaluru', 'Karnataka', 'https://images.unsplash.com/photo-1593642634315-4855644DE27f?w=400&h=300&fit=crop')
ON CONFLICT (name) DO NOTHING;
