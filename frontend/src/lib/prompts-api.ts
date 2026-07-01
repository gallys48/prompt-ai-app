import { apiRequest } from "@/lib/api";
import type {
  Prompt,
  PromptCreateRequest,
  PromptListResponse,
  PromptUpdateRequest,
} from "@/types/prompt";

type ListPromptsParams = {
  search?: string;
  offset?: number;
  limit?: number;
};

export async function listPrompts(
  params: ListPromptsParams = {},
): Promise<PromptListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const path = query ? `/prompts?${query}` : "/prompts";

  return apiRequest<PromptListResponse>(path);
}

export async function createPrompt(
  payload: PromptCreateRequest,
): Promise<Prompt> {
  return apiRequest<Prompt>("/prompts", {
    method: "POST",
    body: payload,
  });
}

export async function updatePrompt(
  promptId: number,
  payload: PromptUpdateRequest,
): Promise<Prompt> {
  return apiRequest<Prompt>(`/prompts/${promptId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deletePrompt(promptId: number): Promise<Prompt> {
  return apiRequest<Prompt>(`/prompts/${promptId}`, {
    method: "DELETE",
  });
}