/*
# [SECURITY] Harden Function Security
This migration enhances security by setting a fixed `search_path` for several database functions. This mitigates the risk of search path hijacking attacks, where a malicious user could create objects in a schema that gets resolved before the intended object.

## Query Description:
- This operation alters existing function definitions.
- It does not modify any data and is considered safe to apply.
- It sets the `search_path` for `get_city_member_counts` and `join_popup_and_chat` to `public`. This ensures that when these functions are executed, they only look for tables, types, and other functions within the `public` schema, preventing potential security vulnerabilities.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unsetting the search_path)

## Structure Details:
- Functions affected:
  - `public.get_city_member_counts()`
  - `public.join_popup_and_chat(uuid, uuid)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- This change hardens the functions against search path attacks.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Secure get_city_member_counts function
-- This function is used on the "Travel with Stranger" page to show member counts.
ALTER FUNCTION public.get_city_member_counts()
SET search_path = public;

-- Secure join_popup_and_chat function
-- This function was created in a previous step. We are now hardening it.
ALTER FUNCTION public.join_popup_and_chat(uuid, uuid)
SET search_path = public;
