/*
# [SECURITY] Set Function Search Path
[This migration hardens the security of the `join_popup_and_chat` function by explicitly setting its `search_path`. This prevents potential hijacking attacks where a malicious user could create objects (like tables or functions) in a different schema that the function might unintentionally use.]

## Query Description: [This operation modifies an existing database function to improve its security. It is a non-destructive change and should not impact existing data or functionality. It's a recommended best practice for all PostgreSQL functions.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function: `public.join_popup_and_chat(p_popup_id uuid, p_user_id uuid)`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [None for migration]
- Mitigates: Search Path Hijacking (CWE-426)

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/
ALTER FUNCTION public.join_popup_and_chat(p_popup_id uuid, p_user_id uuid)
SET search_path = public;
