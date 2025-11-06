/*
          # [RPC] join_popup_and_chat
          This migration creates a PostgreSQL function to handle the logic of a user joining a popup chat group atomically.

          ## Query Description: This function ensures data integrity when a user joins a popup. It checks for available seats, creates a chat group if one doesn't exist, adds the user as a participant, and decrements the seat count. This prevents race conditions. It is safe to run.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Creates RPC function `join_popup_and_chat`.
          
          ## Security Implications:
          - RLS Status: N/A (Function runs with definer's rights).
          - Policy Changes: No.
          - Auth Requirements: The function should be called by an authenticated user via an edge function.
          
          ## Performance Impact:
          - Indexes: N/A.
          - Triggers: No.
          - Estimated Impact: Low. The function is transactional and efficient.
          */

CREATE OR REPLACE FUNCTION public.join_popup_and_chat(p_popup_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id uuid;
  v_seats_available int;
  v_creator_id uuid;
BEGIN
  -- Lock the popup row to prevent race conditions
  SELECT seats_available, creator_id INTO v_seats_available, v_creator_id
  FROM public.city_popups
  WHERE id = p_popup_id
  FOR UPDATE;

  -- Check if user is the creator
  IF v_creator_id = p_user_id THEN
    RAISE EXCEPTION 'Creator cannot join their own popup as a participant.';
  END IF;

  -- Check if seats are available
  IF v_seats_available <= 0 THEN
    RAISE EXCEPTION 'No seats available for this popup.';
  END IF;

  -- Check if a chat for this popup already exists, if not, create it
  SELECT id INTO v_chat_id FROM public.chats WHERE popup_id = p_popup_id;

  IF v_chat_id IS NULL THEN
    -- Create chat and add creator as the first participant
    INSERT INTO public.chats (popup_id) VALUES (p_popup_id) RETURNING id INTO v_chat_id;
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat_id, v_creator_id);
  END IF;

  -- Add the joining user to the chat
  INSERT INTO public.chat_participants (chat_id, user_id)
  VALUES (v_chat_id, p_user_id)
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  -- Decrement seats available
  UPDATE public.city_popups
  SET seats_available = seats_available - 1
  WHERE id = p_popup_id;

  RETURN v_chat_id;
END;
$$;
