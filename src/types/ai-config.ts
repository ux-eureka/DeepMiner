export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIPreset extends AIConfig {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface AIConfigState {
  config: AIConfig;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export const DEFAULT_CONFIG: AIConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 2000,
};
