-- Add 'Anytime' to the time_of_day enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Anytime' AND enumtypid = 'time_of_day'::regtype) THEN
        ALTER TYPE time_of_day ADD VALUE 'Anytime';
    END IF;
END$$;

-- Add timing_tag to locations table if it doesn't exist
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS timing_tag time_of_day;

-- Add demo data for Udaipur and City Palace
DO $$
DECLARE
    udaipur_city_id uuid;
    day1_id uuid;
    city_palace_id uuid;
BEGIN
    -- Insert Udaipur if it doesn't exist
    INSERT INTO public.cities (name, state, description, short_tagline, thumbnail_url, popularity_score, safety_score, best_time_to_visit, weather_info)
    VALUES ('Udaipur', 'Rajasthan', 'Often called the ''Venice of the East'', Udaipur is known for its serene lakes, royal palaces, and vibrant culture.', 'The City of Lakes', 'https://images.unsplash.com/photo-1599661046289-e31897846364?w=800&h=600&fit=crop', 94, 9, 'September to March', 'Pleasant winters and hot summers.')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO udaipur_city_id;

    -- If Udaipur was already there, get its ID
    IF udaipur_city_id IS NULL THEN
        SELECT id INTO udaipur_city_id FROM public.cities WHERE name = 'Udaipur';
    END IF;

    -- Insert Day 1 for Udaipur if it doesn't exist
    INSERT INTO public.days (city_id, day_number, title)
    VALUES (udaipur_city_id, 1, 'Royal Palaces and Lakeside Charm')
    ON CONFLICT (city_id, day_number) DO NOTHING
    RETURNING id INTO day1_id;
    
    IF day1_id IS NULL THEN
        SELECT id INTO day1_id FROM public.days WHERE city_id = udaipur_city_id AND day_number = 1;
    END IF;

    -- Insert City Palace, Udaipur
    INSERT INTO public.locations (day_id, timing_tag, name, category, short_intro, image_url, latitude, longitude, details)
    VALUES (
        day1_id,
        'Morning',
        'City Palace',
        'Royal Palace',
        'A majestic palace complex on the banks of Lake Pichola, showcasing a blend of Rajasthani and Mughal architectural styles.',
        'https://images.unsplash.com/photo-1577154415519-571f045b4a49?w=800&h=600&fit=crop',
        24.5762,
        73.6835,
        '{
            "about": {
                "historical_background": "Built over a period of nearly 400 years, with contributions from several rulers of the Mewar dynasty. Construction began in 1553 by Maharana Udai Singh II.",
                "cultural_significance": "It is the heart of Udaipur and a symbol of the Mewar kingdom''s power and prestige. The palace is still partially owned by the royal family.",
                "why_famous": "Famous for its intricate architecture, sprawling courtyards, and the stunning views it offers of Lake Pichola and the surrounding city."
            },
            "opening_hours": {
                "daily_timings": {"open": "09:30 AM", "close": "05:30 PM"},
                "weekly_closures": [],
                "seasonal_changes": "Timings might change during festivals."
            },
            "best_time_to_visit": {
                "best_season": "Winter (October - March)",
                "best_time_of_day": "Morning to avoid crowds and heat.",
                "festival_timing": "Holi and Diwali are celebrated with grandeur."
            },
            "transport": {
                "nearest_airport": "Maharana Pratap Airport (UDR), 22km",
                "nearest_railway_station": "Udaipur City Railway Station, 3km",
                "last_mile_options": "Auto-rickshaws and taxis are readily available. It is located in the old city, accessible by narrow lanes.",
                "taxi_cost_estimate": "₹150-200 from the railway station."
            },
            "safety_risks": {
                "safety_score": 9,
                "scams_warnings": ["Beware of unofficial guides at the entrance.", "Some shops inside may be overpriced."],
                "womens_safety_rating": "High",
                "emergency_contacts": [{"name": "Tourist Police", "number": "1363"}]
            },
            "cultural_etiquette": {
                "dress_code": "Respectful attire is recommended; cover shoulders and knees.",
                "dos_donts": ["Do hire an official audio guide.", "Don''t touch the artifacts."],
                "temple_etiquette": "Remove shoes before entering small shrines within the complex.",
                "photography_rules": "Photography is allowed, but may require an extra fee for video cameras."
            },
            "costs_money": {
                "ticket_prices": {"local": "₹30", "foreigner": "₹300"},
                "avg_budget_per_day": "₹500-700 per person (including tickets and guide).",
                "haggling_info": "Not applicable for tickets, but required for souvenirs outside.",
                "digital_payment_availability": "Yes, at the ticket counter."
            },
            "amenities": {
                "toilets": "Available, but can be crowded.",
                "wifi": "Not available.",
                "seating": "Available in courtyards.",
                "water_refills": "Available for purchase.",
                "cloakrooms": "Available near the entrance."
            },
            "hygiene_index": {"rating": 4, "notes": "Well-maintained premises."},
            "guides": {"availability": "Official guides and audio guides available.", "booking_info": "Available at the entrance."},
            "map_navigation": {"google_maps_link": "https://goo.gl/maps/qE5gS3aJmSq1z5d5A"},
            "events_festivals": {"event_name": "Holika Dahan Ceremony", "event_date": "March (eve of Holi)", "type": "Cultural"},
            "things_to_do": {
                "main_activities": ["Explore the museum", "Visit the Crystal Gallery", "Enjoy the view of Lake Pichola", "See the vintage car collection."],
                "nearby_attractions": ["Jagdish Temple", "Bagore Ki Haveli"]
            },
            "photo_spots": [
                {"title": "Tripolia Gate View", "description": "Classic shot of the palace entrance.", "image_url": "https://example.com/tripolia.jpg", "map_link": ""},
                {"title": "Mor Chowk (Peacock Courtyard)", "description": "Famous for its intricate glass mosaics of peacocks.", "image_url": "https://example.com/mor_chowk.jpg", "map_link": ""}
            ],
            "recommended_restaurants": [],
            "recommended_hotels": [],
            "local_foods": [],
            "influencer_videos": []
        }'::jsonb
    )
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO city_palace_id;
END $$;
