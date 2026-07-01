import { apiRequest } from "@/lib/api";
import type {
  Chat,
  ChatCreateRequest,
  ChatListResponse,
  ChatMessage,
  ChatMessageListResponse,
  ChatWithMessages,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from "@/types/chat";

type ListChatsParams = {
  offset?: number;
  limit?: number;
};

export async function listChats(
  params: ListChatsParams = {},
): Promise<ChatListResponse> {
  const searchParams = new URLSearchParams();

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const path = query ? `/chats?${query}` : "/chats";

  return apiRequest<ChatListResponse>(path);
}

export async function createChat(payload: ChatCreateRequest): Promise<Chat> {
  return apiRequest<Chat>("/chats", {
    method: "POST",
    body: payload,
  });
}

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

export async function getChat(chatId: number): Promise<ChatWithMessages> {
  return apiRequest<ChatWithMessages>(`/chats/${chatId}`);
}

export async function listChatMessages(
  chatId: number,
): Promise<ChatMessageListResponse> {
  return apiRequest<ChatMessageListResponse>(
    `/chats/${chatId}/messages?offset=0&limit=100`,
  );
}

export async function sendChatMessage(
  chatId: number,
  payload: SendChatMessageRequest,
): Promise<SendChatMessageResponse> {
  return apiRequest<SendChatMessageResponse>(`/chats/${chatId}/messages`, {
    method: "POST",
    body: payload,
  });
}

export async function getChatMessage(
  chatId: number,
  messageId: number,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/chats/${chatId}/messages/${messageId}`);
}

export async function retryChatMessage(
  chatId: number,
  messageId: number,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(
    `/chats/${chatId}/messages/${messageId}/retry`,
    {
      method: "POST",
    },
  );
}

export async function deleteChat(chatId: number): Promise<Chat> {
  return apiRequest<Chat>(`/chats/${chatId}`, {
    method: "DELETE",
  });
}