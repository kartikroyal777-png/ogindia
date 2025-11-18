-- Harden remaining functions by setting a secure search_path
-- This prevents potential hijacking attacks by malicious users.

/*
# [Function Security Hardening]
This migration hardens the security of existing PostgreSQL functions by explicitly setting the `search_path`. This mitigates a class of security vulnerabilities where a malicious actor could potentially create objects in other schemas to hijack function execution.

## Query Description:
- This operation alters three existing functions: `create_popup_with_chat`, `join_popup`, and `handle_new_popup`.
- It sets the `search_path` for each function to `public`, ensuring that they only resolve objects within the public schema.
- This change has no impact on existing data and is purely a security enhancement.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function again to remove the setting)

## Structure Details:
- Functions affected:
  - `create_popup_with_chat(text, uuid, uuid, text, text, timestamp with time zone, timestamp with time zone, integer, text, boolean, boolean, numeric)`
  - `join_popup(uuid)`
  - `handle_new_popup()`

## Security Implications:
- RLS Status: Not changed
- Policy Changes: No
- Auth Requirements: None
- This change directly addresses and resolves the "Function Search Path Mutable" security advisory.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a metadata change on function definitions.
*/

ALTER FUNCTION public.create_popup_with_chat(p_title text, p_city_id uuid, p_creator_id uuid, p_description text, p_destination text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_max_attendees integer, p_gender_preference text, p_open_to_dating boolean, p_open_to_friendship boolean, p_price numeric)
SET search_path = public;

ALTER FUNCTION public.join_popup(p_popup_id uuid)
SET search_path = public;

ALTER FUNCTION public.handle_new_popup()
SET search_path = public;
