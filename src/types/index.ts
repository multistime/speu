export interface GeneratedLyrics {
  id: string;
  genre: string;
  mood: string;
  topic: string;
  content: string;
  created_at: string;
  user_id: string;
}

export interface ServiceOrder {
  name: string;
  email: string;
  serviceType: "generative" | "mixing" | "vocal-cloning";
  description: string;
  budget?: string;
  deadline?: string;
}

export type SupportTier = {
  id: string;
  name: string;
  price: string;
  description: string;
  perks: string[];
  highlighted?: boolean;
};

export type Genre =
  | "folk-electronic"
  | "dark-ambient"
  | "neo-folk"
  | "glitch-folk"
  | "forest-techno"
  | "ritual-drone";

export type Mood =
  | "melancholic"
  | "ritual"
  | "mystical"
  | "eerie"
  | "meditative"
  | "raw";

export type Topic =
  | "swamps"
  | "forests"
  | "ancestry"
  | "mist-rivers"
  | "old-gods"
  | "digital-nature"
  | "forgotten-villages"
  | "night-birds";
