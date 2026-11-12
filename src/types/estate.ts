export interface Property {
  id: string;
  title: string;
  district: string;
  address: string;
  price: number; // В рублях
  rooms: number;
  area: number; // м²
  floor: number;
  totalFloors: number;
  imageUrl: string;
  gallery?: string[];
  description: string;
  features: string[];
  badge?: string;
  metro?: string;
  completionYear?: number;
  createdAt: string;
}

export type LeadSource =
  | "website_booking"
  | "ai_quiz"
  | "ai_chat"
  | "telegram_bot";

export type LeadStatus =
  | "new"
  | "contacted"
  | "viewing_scheduled"
  | "closed";

export interface Lead {
  id: string;
  clientName: string;
  phone: string;
  telegramUsername?: string;
  propertyId?: string;
  propertyTitle?: string;
  preferredDate: string;
  preferredTime?: string;
  budget?: string;
  rooms?: string;
  district?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedPropertyIds?: string[];
  suggestLeadCapture?: boolean;
  timestamp: string;
}

export interface DatabaseSchema {
  properties: Property[];
  leads: Lead[];
}
