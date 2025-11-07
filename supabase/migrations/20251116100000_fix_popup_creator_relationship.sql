/*
  # [Schema Fix] Add Foreign Key to city_popups
  [This migration establishes a foreign key relationship between the 'city_popups' and 'profiles' tables to correctly link popups to their creators.]

  ## Query Description: [This operation adds a foreign key constraint to the `creator_id` column in the `city_popups` table, making it reference the `id` column in the `profiles` table. This ensures data integrity and allows for efficient querying of popup and creator data. If a user's profile is deleted, the `creator_id` on their popups will be set to NULL, preserving the popup content.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: `city_popups`
  - Column: `creator_id`
  - Constraint: `city_popups_creator_id_fkey`
  - Action: Adds a foreign key referencing `profiles(id)` with `ON DELETE SET NULL`.
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [An index will likely be automatically created on `creator_id`.]
  - Triggers: [None]
  - Estimated Impact: [Low. Improves query performance for joins between `city_popups` and `profiles`.]
*/

ALTER TABLE public.city_popups
ADD CONSTRAINT city_popups_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
