/*
# [Function] Create `join_popup_and_chat` RPC
[This script creates or replaces the core database function responsible for allowing a user to join a community popup event. It handles seat availability, chat room creation, and participant management in a single transaction.]

## Query Description: [This operation creates a new database function `join_popup_and_chat`. It is designed to be safe and will not affect existing data. If the function already exists, it will be replaced with this secure and correct version. This is critical for the "Travel With Stranger" feature to work correctly.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function: `public.join_popup_and_chat(p_popup_id uuid, p_user_id uuid)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [This function is `SECURITY DEFINER`, meaning it runs with the permissions of the function owner. The logic inside the function enforces business rules, such as checking for available seats.]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Low. This is a function creation, which has no impact on query performance until it is called.]
*/

CREATE OR REPLACE FUNCTION public.join_popup_and_chat(p_popup_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id uuid;
  v_popup_creator_id uuid;
  v_seats_left int;
  is_participant boolean;
BEGIN
  -- Check if the popup exists and get its details
  SELECT creator_id, seats_available, chat_id
  INTO v_popup_creator_id, v_seats_left, v_chat_id
  FROM public.city_popups
  WHERE id = p_popup_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Popup not found';
  END IF;

  -- If a chat already exists, check if the user is a participant
  IF v_chat_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.chat_participants
      WHERE chat_id = v_chat_id AND user_id = p_user_id
    ) INTO is_participant;

    IF is_participant THEN
      -- User is already in the chat, just return the chat_id
      RETURN v_chat_id;
    END IF;
  END IF;

  -- Business logic: Check for available seats if the user is not the creator
  IF p_user_id <> v_popup_creator_id AND v_seats_left <= 0 THEN
    RAISE EXCEPTION 'No seats available';
  END IF;

  -- If no chat exists for this popup, create one
  IF v_chat_id IS NULL THEN
    -- 1. Create the chat room
    INSERT INTO public.chats (popup_id)
    VALUES (p_popup_id)
    RETURNING id INTO v_chat_id;

    -- 2. Link chat to the popup
    UPDATE public.city_popups
    SET chat_id = v_chat_id
    WHERE id = p_popup_id;

    -- 3. Add the creator to the chat
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (v_chat_id, v_popup_creator_id);
  END IF;

  -- Add the new user to the chat
  INSERT INTO public.chat_participants (chat_id, user_id)
  VALUES (v_chat_id, p_user_id);

  -- Decrement seat count if the user is not the creator
  IF p_user_id <> v_popup_creator_id THEN
    UPDATE public.city_popups
    SET seats_available = seats_available - 1
    WHERE id = p_popup_id;
  END IF;

  RETURN v_chat_id;
END;
$$;

-- Set a fixed search path for security, addressing a previous warning
ALTER FUNCTION public.join_popup_and_chat(uuid, uuid) SET search_path = public;
