export interface GuruMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
