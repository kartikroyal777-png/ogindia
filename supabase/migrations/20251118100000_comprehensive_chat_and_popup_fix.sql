/*
  # [Operation Name]
  Comprehensive Chat and Popup Schema Fix

  ## Query Description: [This migration completely rebuilds the chat and popup functionality to resolve dependency errors. It introduces tables for chat groups, members, and messages, and adds new features to popups like gender preference, pricing, and expiration. It also sets up an automated notification system for new popups. This is a structural change and should be safe to run as it drops and recreates specific objects.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["High"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Drops: `chat_messages`, `chat_group_members`, `chat_groups` tables if they exist.
  - Drops: `notify_on_new_popup` function and its trigger if they exist.
  - Creates: `chat_groups`, `chat_group_members`, `chat_messages` tables with correct RLS policies.
  - Alters: `city_popups` table to add new columns (`max_attendees`, `gender_preference`, etc.) and a foreign key to `chat_groups`.
  - Creates: `notify_on_new_popup` function and trigger for new popup notifications.
  - Creates: `create_popup_with_chat` RPC function to handle popup creation atomically.
  
  ## Security Implications:
  - RLS Status: [Enabled] on all new chat-related tables.
  - Policy Changes: [Yes], new policies are created for chat tables to ensure users can only access their own group data.
  - Auth Requirements: [Authenticated Users] for all chat and popup creation actions.
  
  ## Performance Impact:
  - Indexes: [Added] Primary keys and foreign keys create indexes.
  - Triggers: [Added] One trigger for notifications.
  - Estimated Impact: [Low] on existing query performance.
*/

-- Clean up previous failed attempts
DROP TRIGGER IF EXISTS trigger_notify_on_new_popup ON public.city_popups;
DROP FUNCTION IF EXISTS public.notify_on_new_popup();
DROP FUNCTION IF EXISTS public.create_popup_with_chat(UUID,TEXT,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INT,TEXT,BOOLEAN,BOOLEAN,NUMERIC);
ALTER TABLE IF EXISTS public.city_popups DROP CONSTRAINT IF EXISTS city_popups_chat_group_id_fkey;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_group_members;
DROP TABLE IF EXISTS public.chat_groups;

-- Add new columns to city_popups if they don't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='max_attendees') THEN
    ALTER TABLE public.city_popups ADD COLUMN max_attendees INT NOT NULL DEFAULT 10;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='gender_preference') THEN
    ALTER TABLE public.city_popups ADD COLUMN gender_preference TEXT NOT NULL DEFAULT 'any';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='open_to_dating') THEN
    ALTER TABLE public.city_popups ADD COLUMN open_to_dating BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='open_to_friendship') THEN
    ALTER TABLE public.city_popups ADD COLUMN open_to_friendship BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='price') THEN
    ALTER TABLE public.city_popups ADD COLUMN price NUMERIC;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='expires_at') THEN
    ALTER TABLE public.city_popups ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='chat_group_id') THEN
    ALTER TABLE public.city_popups ADD COLUMN chat_group_id UUID;
  END IF;
END;
$$;

-- Step 1: Create chat_groups table
CREATE TABLE public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    popup_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key from city_popups to chat_groups
ALTER TABLE public.city_popups
ADD CONSTRAINT city_popups_chat_group_id_fkey
FOREIGN KEY (chat_group_id)
REFERENCES public.chat_groups(id)
ON DELETE SET NULL;

-- Step 3: Create chat_group_members table
CREATE TABLE public.chat_group_members (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (group_id, user_id)
);

-- Step 4: Create chat_messages table
CREATE TABLE public.chat_messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    location_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 5: Enable RLS and create policies
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of" ON public.chat_groups FOR SELECT USING (id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can view members of groups they are in" ON public.chat_group_members FOR SELECT USING (group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert themselves into a group" ON public.chat_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view messages in their groups" ON public.chat_messages FOR SELECT USING (group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages in their groups" ON public.chat_messages FOR INSERT WITH CHECK (user_id = auth.uid() AND group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));

-- Step 6: Create notification function and trigger
CREATE OR REPLACE FUNCTION public.notify_on_new_popup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, message, title, entity_id)
  SELECT
    ujc.user_id,
    'new_popup'::text,
    'A new popup "' || NEW.title || '" has been created in ' || (SELECT name FROM public.cities WHERE id = NEW.city_id) || '. Check it out!',
    'New Popup Alert!',
    NEW.id::text
  FROM
    public.user_joined_cities AS ujc
  WHERE
    ujc.city_id = NEW.city_id
    AND ujc.user_id != NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_new_popup
AFTER INSERT ON public.city_popups
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_popup();

-- Step 7: Create RPC function for atomic popup creation
CREATE OR REPLACE FUNCTION public.create_popup_with_chat(
    p_city_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_max_attendees INT,
    p_gender_preference TEXT,
    p_open_to_dating BOOLEAN,
    p_open_to_friendship BOOLEAN,
    p_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_group_id UUID;
  new_popup_id UUID;
  creator_id UUID := auth.uid();
BEGIN
  INSERT INTO public.chat_groups (name) VALUES (p_title) RETURNING id INTO new_chat_group_id;

  INSERT INTO public.city_popups (city_id, creator_id, title, description, start_time, end_time, chat_group_id, max_attendees, gender_preference, open_to_dating, open_to_friendship, price, expires_at)
  VALUES (p_city_id, creator_id, p_title, p_description, p_start_time, p_end_time, new_chat_group_id, p_max_attendees, p_gender_preference, p_open_to_dating, p_open_to_friendship, p_price, p_end_time)
  RETURNING id INTO new_popup_id;

  UPDATE public.chat_groups SET popup_id = new_popup_id WHERE id = new_chat_group_id;

  INSERT INTO public.chat_group_members (group_id, user_id) VALUES (new_chat_group_id, creator_id);

  RETURN new_popup_id;
END;
$$;
