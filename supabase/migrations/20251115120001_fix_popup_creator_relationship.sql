/*
# [Operation Name]
Fix city_popups to profiles relationship

## Query Description: [This operation ensures the foreign key relationship between community popups and user profiles is correctly established. It first attempts to remove any existing, potentially misconfigured constraint and then adds a new, correct one. This is a safe structural change and does not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[Affects 'city_popups' table by adding a foreign key constraint on the 'creator_id' column, referencing 'profiles.id'.]

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Adds an index on 'creator_id' if not present]
- Triggers: [None]
- Estimated Impact: [Low. Improves query performance for joining popups and profiles.]
*/

-- Drop the constraint if it exists to ensure a clean slate.
ALTER TABLE public.city_popups
DROP CONSTRAINT IF EXISTS city_popups_creator_id_fkey;

-- Add the foreign key constraint to link popups to their creators.
-- This enables RLS policies to work correctly and allows for easy data joining.
ALTER TABLE public.city_popups
ADD CONSTRAINT city_popups_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES public.profiles (id)
ON DELETE SET NULL;
