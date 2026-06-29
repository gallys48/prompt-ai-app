export type Prompt = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PromptListResponse = {
  items: Prompt[];
  total: number;
  offset: number;
  limit: number;
};