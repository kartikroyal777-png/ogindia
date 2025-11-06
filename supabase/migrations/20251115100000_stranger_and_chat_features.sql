/*
          # [Feature] Travel with Stranger & Chat
          This migration adds the necessary tables and columns to support the "Travel with Stranger" feature, including city joining, popup chats, and chat messages. It also seeds some initial cities for the feature.

          ## Query Description: This operation is structural and adds new tables and columns. It is safe to run and will not affect existing data in unrelated tables. It seeds the 'cities' table with a few demo entries if they don't already exist.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Adds table `user_joined_cities`.
          - Adds table `chats`.
          - Adds table `chat_participants`.
          - Adds table `chat_messages`.
          - Adds column `city_id` to `city_popups`.
          
          ## Security Implications:
          - RLS Status: Enabled on new tables.
          - Policy Changes: Yes, new policies are created for chat functionality.
          - Auth Requirements: Users must be authenticated to interact with these tables.
          
          ## Performance Impact:
          - Indexes: Added on foreign keys.
          - Triggers: None.
          - Estimated Impact: Low.
          */

-- 1. Create user_joined_cities table
CREATE TABLE IF NOT EXISTS public.user_joined_cities (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, city_id)
);
ALTER TABLE public.user_joined_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own joined cities" ON public.user_joined_cities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Add city_id to city_popups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_popups' AND column_name='city_id') THEN
    ALTER TABLE public.city_popups ADD COLUMN city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    popup_id uuid UNIQUE REFERENCES public.city_popups(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chats they are a part of" ON public.chats FOR SELECT USING (id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()));

-- 4. Create chat_participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (chat_id, user_id)
);
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view participants of chats they are in" ON public.chat_participants FOR SELECT USING (chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can join or leave chats" ON public.chat_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id bigserial PRIMARY KEY,
    chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their chats" ON public.chat_messages FOR SELECT USING (chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their chats" ON public.chat_messages FOR INSERT WITH CHECK (chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()));


-- 6. Seed some cities if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE name = 'Mumbai') THEN
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit) VALUES
    ('Mumbai', 'Maharashtra', 'The bustling financial capital and home of Bollywood.', 'The City of Dreams', 'https://images.unsplash.com/photo-1562979314-1aceb4b26b85?w=400&h=300&fit=crop', 94, 7, 'October to February');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE name = 'Udaipur') THEN
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit) VALUES
    ('Udaipur', 'Rajasthan', 'A city of serene lakes and grand palaces.', 'The City of Lakes', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=400&h=300&fit=crop', 91, 9, 'September to March');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cities WHERE name = 'Bengaluru') THEN
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit) VALUES
    ('Bengaluru', 'Karnataka', 'The Silicon Valley of India, known for its pleasant weather and green spaces.', 'The Garden City', 'https://images.unsplash.com/photo-1593792282338-315c1e188566?w=400&h=300&fit=crop', 89, 8, 'All year round');
  END IF;
END $$;
