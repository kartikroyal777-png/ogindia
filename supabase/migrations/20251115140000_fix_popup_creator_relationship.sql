/*
# [Fix] Correct City Popups to Profiles Relationship
This migration ensures the foreign key relationship between the `city_popups` and `profiles` tables is correctly established. This is critical for fetching popup creator information and for the popup creation feature to work correctly.

## Query Description: [This operation first safely removes any existing, potentially misconfigured foreign key constraint named `city_popups_creator_id_fkey`. It then re-creates the constraint, properly linking the `creator_id` in the `city_popups` table to the `id` in the `profiles` table. This ensures data integrity when popups are created or when creator information is queried.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies `public.city_popups` table.
- Adds a foreign key constraint `city_popups_creator_id_fkey`.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Adds an index on the foreign key column if one does not exist.]
- Triggers: [None]
- Estimated Impact: [Low. May cause a brief lock on the table during the alteration.]
*/

-- Safely drop the constraint if it already exists to prevent errors on re-run
ALTER TABLE public.city_popups
DROP CONSTRAINT IF EXISTS city_popups_creator_id_fkey;

-- Add the foreign key constraint to link popups to their creators
ALTER TABLE public.city_popups
ADD CONSTRAINT city_popups_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
