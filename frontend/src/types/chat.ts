export type MessageSenderType = "user" | "assistant" | "system";

export type MessageStatus = "pending" | "processing" | "completed" | "failed";

export type Chat = {
  id: number;
  user_id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  chat_id: number;
  sender_type: MessageSenderType;
  status: MessageStatus;
  text: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageListResponse = {
  items: ChatMessage[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
};