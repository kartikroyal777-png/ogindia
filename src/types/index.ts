export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  ig_link?: string;
  plan_type: 'free' | 'paid';
  food_scanner_used: number;
  trip_planner_used: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  description: string;
  short_tagline: string;
  thumbnail_url: string;
  popularity_score: number;
  safety_score: number;
  best_time_to_visit: string;
  weather_info: string;
  city_categories?: { category_id: string }[];
}

export interface Day {
  id: string;
  city_id: string;
  day_number: number;
  title: string;
}

export interface LocationImage {
  id: string;
  location_id: string;
  image_url: string;
  caption?: string;
}

export interface Location {
  id: string;
  day_id: string;
  name: string;
  category: string;
  short_intro: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  timing_tag: TimeOfDay;
  details: any; // Using 'any' for this complex nested JSON
  images?: LocationImage[];
  day?: Day; // For nested queries
}

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';

export interface SafetyAlert {
  id: string;
  location: string;
  type: 'scam' | 'safety' | 'health';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  reported_at: string;
  verified: boolean;
}

export interface SavedPlace {
  user_id: string;
  location_id: string;
  created_at: string;
  locations: Location;
}

export interface CityPopup {
  id: string;
  city_id: string;
  creator_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  created_at: string;
  creator: Profile;
  max_attendees: number;
  expires_at: string;
  gender_preference: 'any' | 'male' | 'female';
  open_to_dating: boolean;
  open_to_friendship: boolean;
  price?: number;
  chat_group_id: string;
  chat_groups: { id: string }[]; // For querying joined status
}

export interface Notification {
  id: number;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: 'new_popup' | 'chat_message' | 'friend_request' | 'info' | 'promo' | 'alert';
  entity_id: string;
  title?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  created_at: string;
  popup_id?: string;
}

export interface ChatMessage {
  id: number;
  group_id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  location_data?: { lat: number; lng: number };
  created_at: string;
  profiles: Profile;
}

export interface ChatGroupMember {
  id: number;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Phrase {
  id: string;
  category: string;
  en: string;
  hi: string;
  pronunciation?: string;
  is_adult: boolean;
  created_at: string;
}

export interface BargainingPrice {
  id: string;
  location_name: string;
  item_name: string;
  fair_price_range: string;
  quoted_price_range: string;
}

// Trip Planner Types
export interface Activity {
  id: string;
  time: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  type: 'spot' | 'hotel' | 'food';
  google_maps_link?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
}

export interface TripPreferences {
  days: number;
  destination: string;
  style: 'cultural' | 'romantic' | 'family' | 'adventure';
  companions: 'solo' | 'couple' | 'family' | 'friends';
}

export interface SavedTrip {
  id: string;
  user_id: string;
  created_at: string;
  trip_details: {
    preferences: TripPreferences;
    itinerary: DayPlan[];
  };
}
