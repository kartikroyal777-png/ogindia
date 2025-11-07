/*
  # [Operation Name]
  Create User-City Join Table and Member Count Function

  ## Query Description: [This migration introduces the `user_joined_cities` table, which is essential for the "Travel With Stranger" feature. It links users to the cities they have "joined." It also creates a helper function to efficiently count members in each city. This is a structural change and is safe to apply as it only adds new database objects.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Tables Added:
    - `public.user_joined_cities`: Stores relationships between users and cities.
  - Functions Added:
    - `public.get_city_member_counts()`: RPC to count members per city.
  - RLS Policies Added:
    - Policies on `user_joined_cities` to allow users to manage their own city memberships.

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Authenticated users for all operations]

  ## Performance Impact:
  - Indexes: [Added primary key and foreign key indexes]
  - Triggers: [None]
  - Estimated Impact: [Low. The new table and function will have minimal impact on existing operations.]
*/

-- 1. Create the user_joined_cities table
CREATE TABLE public.user_joined_cities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    city_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_joined_cities_pkey PRIMARY KEY (id),
    CONSTRAINT user_joined_cities_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE,
    CONSTRAINT user_joined_cities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_joined_cities_user_id_city_id_key UNIQUE (user_id, city_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_joined_cities ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Allow users to view all joined cities (e.g., for member counts)
CREATE POLICY "Allow authenticated read access"
ON public.user_joined_cities
FOR SELECT
TO authenticated
USING (true);

-- Allow users to join a city (insert their own record)
CREATE POLICY "Allow individual insert"
ON public.user_joined_cities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave a city (delete their own record)
CREATE POLICY "Allow individual delete"
ON public.user_joined_cities
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create the RPC function to count members
CREATE OR REPLACE FUNCTION public.get_city_member_counts()
RETURNS TABLE(city_id uuid, member_count bigint)
LANGUAGE sql
STABLE
AS $$
    SELECT
        city_id,
        count(*) as member_count
    FROM
        public.user_joined_cities
    GROUP BY
        city_id;
$$;
