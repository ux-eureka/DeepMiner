export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'custom';

export interface AIConfig {
  provider: AIProvider;
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

export const DEFAULT_CONFIGS: Record<AIProvider, AIConfig> = {
  openai: {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2000,
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 4000,
  },
  google: {
    provider: 'google',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2000,
  },
  deepseek: {
    provider: 'deepseek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
  },
  custom: {
    provider: 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2000,
  },
};
