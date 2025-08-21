
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  role?: string; // Optional role property
}
export interface Place {
    business_status?: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    name: string;
    opening_hours?: {
        open_now: boolean;
    };
    photos?: Array<{
        photo_reference: string;
    }>;
    place_id: string;
    plus_code?: {
        compound_code: string;
        global_code: string;
    };
    rating?: number;
    reference: string;
    types: string[];
    user_ratings_total?: number;
    vicinity: string;
}

export type PaymentStatus = "advanced" | "full_payment" | "cash_on_delivery";