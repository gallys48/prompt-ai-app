export type Prompt = {
  id: number;
  user_id: number;
  user_update_id: number | null;
  type: string;
  short_description: string;
  text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_username: string | null;
};

export type PromptCreateRequest = {
  type: string;
  short_description: string;
  text: string;
};

export type PromptUpdateRequest = {
  type?: string;
  short_description?: string;
  text?: string;
};

export type PromptListResponse = {
  items: Prompt[];
  total: number;
  offset: number;
  limit: number;
};