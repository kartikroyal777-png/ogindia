/*
          # [Operation Name]
          Harden Function Security

          ## Query Description: 
          This migration enhances the security of several database functions by explicitly setting the `search_path`. This prevents potential hijacking attacks where a malicious user could create objects (like tables or functions) in a schema they control, causing the function to execute unintended code. This change aligns with security best practices and resolves the "Function Search Path Mutable" warnings from the security advisory. There is no risk to existing data.

          ## Metadata:
          - Schema-Category: "Safe"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Modifies function: `create_popup_with_chat`
          - Modifies function: `join_popup`
          - Modifies function: `handle_new_popup`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact.
          */

ALTER FUNCTION public.create_popup_with_chat(p_title text, p_city_id uuid, p_creator_id uuid, p_description text, p_destination text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_max_attendees integer, p_gender_preference text, p_open_to_dating boolean, p_open_to_friendship boolean, p_price numeric)
SET search_path = 'public';

ALTER FUNCTION public.join_popup(p_popup_id uuid)
SET search_path = 'public';

ALTER FUNCTION public.handle_new_popup()
SET search_path = 'public';
