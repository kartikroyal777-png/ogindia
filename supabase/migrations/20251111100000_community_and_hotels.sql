/*
          # [Operation Name]
          Create Community & Hotel Features Schema

          ## Query Description: [This script adds new tables and columns to support the "Travel with Stranger" (Community) and Hotel Booking features. It creates tables for city popups, travel reviews, and hotel API call caching. It also modifies the user profiles table to include an Instagram link.]

          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]

          ## Structure Details:
          - Adds `city_popups` table for user-generated trips/meetups.
          - Adds `travel_reviews` table for user-to-user feedback.
          - Adds `hotels_cache` table to cache Amadeus API responses.
          - Adds `ig_link` column to the `profiles` table.

          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Users must be authenticated to create popups and reviews.]

          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Low performance impact on existing queries.]
          */

-- Add Instagram link to profiles
alter table public.profiles
add column ig_link text;

-- Create table for city popups (Travel with Stranger)
create table public.city_popups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade not null,
  city_id uuid references public.cities(id) on delete cascade,
  destination text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  seats_available int default 1,
  price numeric(10, 2),
  type text not null, -- 'Trip', 'Meetup', 'Photo Walk', etc.
  description text,
  gender_pref text default 'all' check (gender_pref in ('all', 'females_only', 'males_only')),
  allow_dating boolean default false,
  allow_friendship boolean default true,
  verified_only boolean default false,
  image_url text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- RLS for city_popups
alter table public.city_popups enable row level security;

create policy "Users can view all active popups"
on public.city_popups for select
using ( expires_at > now() );

create policy "Users can create their own popups"
on public.city_popups for insert
with check ( auth.uid() = creator_id );

create policy "Users can update their own popups"
on public.city_popups for update
using ( auth.uid() = creator_id );

create policy "Users can delete their own popups"
on public.city_popups for delete
using ( auth.uid() = creator_id );

-- Create table for travel reviews
create table public.travel_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_id uuid references auth.users(id) on delete cascade not null,
  popup_id uuid references public.city_popups(id) on delete set null,
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- RLS for travel_reviews
alter table public.travel_reviews enable row level security;

create policy "Users can view all reviews"
on public.travel_reviews for select
using ( true );

create policy "Users can create reviews"
on public.travel_reviews for insert
with check ( auth.uid() = reviewer_id );

-- Create table for hotel API caching
create table public.hotels_cache (
  id uuid primary key default gen_random_uuid(),
  search_key text unique not null, -- e.g., "JAI:2025-11-01:2025-11-03:2"
  data jsonb not null,
  created_at timestamptz default now()
);

-- RLS for hotels_cache (publicly readable)
alter table public.hotels_cache enable row level security;

create policy "Cache is publicly readable"
on public.hotels_cache for select
using ( true );
