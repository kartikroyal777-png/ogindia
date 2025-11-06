/*
# [Fix] Make Community &amp; Hotels Migration Idempotent
This script ensures that the database schema for the community and hotel features can be applied safely, even if parts of it already exist. It prevents "already exists" errors during migration.

## Query Description: 
This operation checks for the existence of tables and columns before creating them. It will add the `city_popups`, `travel_reviews`, and `hotel_bookings` tables if they are missing, and add the `ig_link` column to the `profiles` table if it's not already there. It also recreates related RLS policies to ensure they are up-to-date. This is a safe operation and will not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Adds table `city_popups` if not exists.
- Adds table `travel_reviews` if not exists.
- Adds table `hotel_bookings` if not exists.
- Adds column `ig_link` to `profiles` if not exists.
- Recreates RLS policies for the new tables.

## Security Implications:
- RLS Status: Enabled on new tables.
- Policy Changes: Yes, policies are dropped and recreated to ensure correctness.
- Auth Requirements: Policies are based on `auth.uid()`.

## Performance Impact:
- Indexes: Primary keys are indexed by default.
- Triggers: None.
- Estimated Impact: Low. The checks add minimal overhead to the migration process.
*/

-- Add Instagram link to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'ig_link' AND NOT attisdropped) THEN
    ALTER TABLE public.profiles ADD COLUMN ig_link text;
  END IF;
END $$;

-- Create table for community popups (Travel with Stranger) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.city_popups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
    destination text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    seats_available integer NOT NULL DEFAULT 1,
    price numeric(10, 2),
    type text NOT NULL,
    description text,
    gender_pref text DEFAULT 'all',
    allow_dating boolean DEFAULT false,
    allow_friendship boolean DEFAULT true,
    verified_only boolean DEFAULT false,
    image_url text,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create table for travel reviews if it doesn't exist
CREATE TABLE IF NOT EXISTS public.travel_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  popup_id uuid REFERENCES public.city_popups(id) ON DELETE CASCADE,
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create table for hotel bookings (simplified for affiliate model) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    hotel_name text NOT NULL,
    city text NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    booking_provider text,
    confirmation_id text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on tables
ALTER TABLE public.city_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for city_popups (Drop and recreate to ensure they are correct)
DROP POLICY IF EXISTS "Public can read city popups" ON public.city_popups;
CREATE POLICY "Public can read city popups" ON public.city_popups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own popups" ON public.city_popups;
CREATE POLICY "Users can create their own popups" ON public.city_popups FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own popups" ON public.city_popups;
CREATE POLICY "Users can update their own popups" ON public.city_popups FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete their own popups" ON public.city_popups;
CREATE POLICY "Users can delete their own popups" ON public.city_popups FOR DELETE USING (auth.uid() = creator_id);

-- RLS policies for travel_reviews (Drop and recreate)
DROP POLICY IF EXISTS "Public can read travel reviews" ON public.travel_reviews;
CREATE POLICY "Public can read travel reviews" ON public.travel_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.travel_reviews;
CREATE POLICY "Users can insert their own reviews" ON public.travel_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- RLS policies for hotel_bookings (Drop and recreate)
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.hotel_bookings;
CREATE POLICY "Users can view their own bookings" ON public.hotel_bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.hotel_bookings;
CREATE POLICY "Users can insert their own bookings" ON public.hotel_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.hotel_bookings;
CREATE POLICY "Users can update their own bookings" ON public.hotel_bookings FOR UPDATE USING (auth.uid() = user_id);
