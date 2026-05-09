interface MessageContent {
  type: string;
  image_url?: { url: string };
  text?: string;
}

export interface Message {
  role: string;
  content: string | MessageContent[];
}

export interface ChatBody {
  model: string;
  messages: Message[];
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}
