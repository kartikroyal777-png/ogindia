-- Add new columns to city_popups to support new features
ALTER TABLE public.city_popups
  ADD COLUMN IF NOT EXISTS max_attendees integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS gender_pref text DEFAULT 'all'::text,
  ADD COLUMN IF NOT EXISTS allow_dating boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_friendship boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Set a default expiry for existing popups (e.g., 24 hours from creation)
UPDATE public.city_popups
SET expires_at = created_at + interval '24 hours'
WHERE expires_at IS NULL;

-- Now, make expires_at not nullable
ALTER TABLE public.city_popups
  ALTER COLUMN expires_at SET NOT NULL;

-- Add foreign key from chat_groups to city_popups
-- This will fix the relationship error and ensure data integrity.
ALTER TABLE public.chat_groups
  ADD CONSTRAINT chat_groups_popup_id_fkey
  FOREIGN KEY (popup_id)
  REFERENCES public.city_popups(id)
  ON DELETE CASCADE;

-- Add type and metadata columns to chat_messages for rich content (images, locations)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Create the trigger function that sends notifications to city members
CREATE OR REPLACE FUNCTION public.notify_city_members_on_new_popup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  city_name_text text;
BEGIN
  -- Get the city name for the notification message
  SELECT name INTO city_name_text FROM public.cities WHERE id = NEW.city_id;

  -- Insert notifications for all users who have joined the city, except the popup creator
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT
    user_id,
    'New Popup in ' || city_name_text,
    'A new popup "' || NEW.title || '" has been created in ' || city_name_text || '!',
    'info'
  FROM
    public.user_joined_cities
  WHERE
    city_id = NEW.city_id AND user_id <> NEW.creator_id;

  RETURN NEW;
END;
$$;

-- Create the trigger that fires the function after a new popup is inserted
DROP TRIGGER IF EXISTS on_new_popup_created ON public.city_popups;
CREATE TRIGGER on_new_popup_created
  AFTER INSERT ON public.city_popups
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_city_members_on_new_popup();

-- Update RLS policy to hide expired popups from being selected
DROP POLICY IF EXISTS "Enable read access for all users" ON public.city_popups;
CREATE POLICY "Enable read access for all users"
ON public.city_popups
FOR SELECT
USING (expires_at > now());
