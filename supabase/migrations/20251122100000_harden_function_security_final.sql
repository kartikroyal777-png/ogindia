/*
  # [Operation Name]
  Harden Function Security

  ## Query Description: 
  This script hardens the security of existing PostgreSQL functions by explicitly setting their `search_path`. This prevents potential hijacking attacks where a malicious user could create objects (like tables or functions) in a public schema that would be executed instead of the intended objects. This change resolves the "Function Search Path Mutable" security advisory. It is a non-destructive, safe operation.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Alters `create_popup_with_chat` function
  - Alters `join_popup` function
  - Alters `handle_new_popup` function

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None
  - Mitigates search path hijacking vulnerabilities.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/

-- Harden the function that creates popups and chat groups
ALTER FUNCTION public.create_popup_with_chat(p_title text, p_city_id uuid, p_creator_id uuid, p_description text, p_destination text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_max_attendees integer, p_gender_preference text, p_open_to_dating boolean, p_open_to_friendship boolean, p_price numeric)
SET search_path = 'public';

-- Harden the function that allows users to join a popup's chat
ALTER FUNCTION public.join_popup(p_popup_id uuid)
SET search_path = 'public';

-- Harden the trigger function that automatically creates a chat group
ALTER FUNCTION public.handle_new_popup()
SET search_path = 'public';
