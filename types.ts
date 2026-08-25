export enum Sender {
  USER = 'user',
  AI = 'model'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  images?: string[];
  isError?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  promptTrigger: string;
  icon: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentTopicId: string | null;
}