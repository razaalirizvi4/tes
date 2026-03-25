import { createClient } from "@supabase/supabase-js";
import { RealtimeChannel } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase URL or Anon Key is not defined in the environment variables"
  );
}

/**
 * Client-side Supabase client for use in React components
 * This client is optimized for browser usage with Realtime subscriptions
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Enable heartbeat to keep connection alive
    heartbeatIntervalMs: 30000,
    // Enable reconnect with exponential backoff
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
  },
});

/**
 * TypeScript type for a raw order from the database
 * This matches the Prisma Order model structure
 */
export interface DatabaseOrder {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  specialInstructions: string | null;
  paymentMethod: string;
  driverId: string | null;
  phoneNumber: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedTime: number | null;
  actualTime: number | null;
  driverRating: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Realtime subscription payload for INSERT events
 */
export interface RealtimeInsertPayload<T = DatabaseOrder> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT";
  new: T;
  old: null;
  errors: null;
}

export type { RealtimeChannel };
