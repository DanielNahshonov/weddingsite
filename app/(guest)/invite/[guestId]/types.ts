export interface RsvpActionPayload {
  status: "idle" | "success" | "error";
  attending?: boolean | null;
  error?: string;
  timestamp?: number;
}
