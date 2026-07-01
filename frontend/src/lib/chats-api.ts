import { apiRequest } from "@/lib/api";
import type { Chat } from "@/types/chat";

export type CreateChatFromPromptRequest = {
  title: string;
};

export async function createChatFromPrompt(
  promptId: number,
  payload: CreateChatFromPromptRequest,
): Promise<Chat> {
  return apiRequest<Chat>(`/chats/from-prompt/${promptId}`, {
    method: "POST",
    body: payload,
  });
}