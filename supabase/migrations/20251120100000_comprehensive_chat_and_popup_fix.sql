-- Comprehensive Schema and Feature Fix for Popups and Chat
-- This script corrects previous migration errors and implements new features.

-- 1. Add new columns to the city_popups table.
-- Using IF NOT EXISTS to ensure the script is re-runnable.
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS max_attendees INT DEFAULT 10;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'any'; -- 'any', 'male', 'female'
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS open_to_dating BOOLEAN DEFAULT FALSE;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS open_to_friendship BOOLEAN DEFAULT TRUE;
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- 2. Create the chat tables in the correct dependency order.
-- Create chat_groups table first.
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    popup_id UUID UNIQUE
);

-- Create chat_group_members table, which depends on chat_groups and profiles.
CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create chat_messages table, which depends on chat_groups and profiles.
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    location_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Now that chat_groups exists, add the foreign key to city_popups.
-- First, drop the old constraint if it exists to avoid errors.
ALTER TABLE public.city_popups DROP CONSTRAINT IF EXISTS city_popups_chat_group_id_fkey;
-- Add the column if it doesn't exist.
ALTER TABLE public.city_popups ADD COLUMN IF NOT EXISTS chat_group_id UUID;
-- Add the foreign key constraint.
ALTER TABLE public.city_popups ADD CONSTRAINT city_popups_chat_group_id_fkey
FOREIGN KEY (chat_group_id) REFERENCES public.chat_groups(id) ON DELETE SET NULL;

-- Link the popup_id in chat_groups back to city_popups for easier lookups.
ALTER TABLE public.chat_groups ADD CONSTRAINT chat_groups_popup_id_fkey
FOREIGN KEY (popup_id) REFERENCES public.city_popups(id) ON DELETE CASCADE;


-- 4. Create or replace functions and triggers.
-- Function to send notifications to city members when a new popup is created.
CREATE OR REPLACE FUNCTION public.send_popup_notification()
RETURNS TRIGGER AS $$
DECLARE
    city_member RECORD;
    notification_message TEXT;
    city_name_text TEXT;
BEGIN
    -- Get city name
    SELECT name INTO city_name_text FROM public.cities WHERE id = NEW.city_id;

    notification_message := 'A new popup "' || NEW.title || '" has been created in ' || city_name_text || '!';

    -- Loop through all users who have joined this city, except the creator of the popup.
    FOR city_member IN
        SELECT user_id FROM public.user_joined_cities WHERE city_id = NEW.city_id AND user_id != NEW.creator_id
    LOOP
        -- Insert a notification for each member.
        INSERT INTO public.notifications (user_id, message, type, entity_id)
        VALUES (city_member.user_id, notification_message, 'new_popup', NEW.id);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the notification function after a popup is inserted.
DROP TRIGGER IF EXISTS after_popup_created ON public.city_popups;
CREATE TRIGGER after_popup_created
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.send_popup_notification();


-- 5. Set up Row Level Security (RLS) policies for the new tables.
-- Policies for chat_groups
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to see their groups" ON public.chat_groups;
CREATE POLICY "Allow members to see their groups" ON public.chat_groups
FOR SELECT USING (
    id IN (
        SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Allow popup creators to create chat groups" ON public.chat_groups;
CREATE POLICY "Allow popup creators to create chat groups" ON public.chat_groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for chat_group_members
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to see other members of their groups" ON public.chat_group_members;
CREATE POLICY "Allow members to see other members of their groups" ON public.chat_group_members
FOR SELECT USING (
    group_id IN (
        SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Allow users to join/leave their own groups" ON public.chat_group_members;
CREATE POLICY "Allow users to join/leave their own groups" ON public.chat_group_members
FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow popup joiners to be added" ON public.chat_group_members;
CREATE POLICY "Allow popup joiners to be added" ON public.chat_group_members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to see messages in their groups" ON public.chat_messages;
CREATE POLICY "Allow members to see messages in their groups" ON public.chat_messages
FOR SELECT USING (
    group_id IN (
        SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Allow members to send messages in their groups" ON public.chat_messages;
CREATE POLICY "Allow members to send messages in their groups" ON public.chat_messages
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND group_id IN (
        SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Allow members to manage their own messages" ON public.chat_messages;
CREATE POLICY "Allow members to manage their own messages" ON public.chat_messages
FOR UPDATE USING (user_id = auth.uid());
