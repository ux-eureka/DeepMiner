import { SYSTEM_RULES } from '../config/promptsConfig';

interface Message {
  type: 'system' | 'user' | 'system_warning';
  content: string;
}

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export const generateThinkingResponse = async (
  history: Message[],
  currentUserInput: string,
  nextTask: string,
  config?: LLMConfig
): Promise<string> => {
  // 1. Determine Configuration with Smart Priority
  // We prioritize valid config from UI over Environment Variables.
  // But if UI config is empty/default (no apiKey), we fall back to Env.
  
  const envApiKey = process.env.NEXT_PUBLIC_API_KEY;
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // Check if config argument has a valid (non-empty) API key
  const hasValidConfigKey = config?.apiKey && config.apiKey.trim().length > 0;
  
  let apiKey: string | undefined;
  let rawBaseUrl: string | undefined;
  let model = config?.model || 'deepseek-chat';

  if (hasValidConfigKey) {
      // Case A: User has manually configured settings in UI
      apiKey = config.apiKey;
      rawBaseUrl = config.baseUrl;
      model = config.model || 'deepseek-chat';
      
      // Safety check: if user configured a key but left URL empty, 
      // check if it's the default provider (OpenAI) or Custom.
      // If Custom and empty URL, it's invalid.
      // If OpenAI and empty URL, it defaults to openai.com (handled by UI defaults usually).
      // But if UI sends us empty string, we should fall back to Env URL? No, that mixes configs.
      // Better to throw error if UI config is partial.
  } else {
      // Case B: No UI config or default empty config -> Use Environment Variables
      apiKey = envApiKey;
      rawBaseUrl = envBaseUrl;
      // Default model for env config is deepseek-chat unless URL param overrides it later
      model = 'deepseek-chat'; 
  }

  // 2. Validate Configuration
  if (!apiKey || !rawBaseUrl) {
    console.error('Missing API Config', { 
        source: hasValidConfigKey ? 'UI' : 'Env',
        hasApiKey: !!apiKey, 
        hasBaseUrl: !!rawBaseUrl 
    });
    throw new Error('未配置 API Key 或 Base URL。请在系统设置中配置，或检查环境变量。');
  }

  // 3. Parse Base URL and Model from "target" parameter if present
  // Example: https://cloud.siliconflow.cn/models?target=deepseek-ai/DeepSeek-V3.2
  let baseUrl = rawBaseUrl;
  try {
    if (rawBaseUrl.includes('?')) {
      const urlObj = new URL(rawBaseUrl);
      const targetParam = urlObj.searchParams.get('target');
      if (targetParam) {
        model = targetParam; // Override model with target param
      }
      
      // Special handling for SiliconFlow dashboard URLs
      if (urlObj.hostname === 'cloud.siliconflow.cn') {
          baseUrl = 'https://api.siliconflow.cn/v1';
      } else {
          // For other providers, we use origin + pathname but strip query params
          baseUrl = urlObj.origin + urlObj.pathname;
      }
    }
  } catch (e) {
    console.warn('Failed to parse Base URL:', e);
    // Proceed with rawBaseUrl if parsing fails
  }

 // Clean up trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Note: Standard OpenAI compatible endpoint is /chat/completions
  // But some users might already provide the full path in their config or env
  let endpoint = '';
  if (baseUrl.endsWith('/chat/completions')) {
      endpoint = baseUrl;
  } else {
      endpoint = `${baseUrl}/chat/completions`;
  }
  
  const systemMessage = {
    role: 'system',
    content: SYSTEM_RULES,
  };

  const historyMessages = history
    .filter((m) => m.type === 'user' || m.type === 'system')
    .map((m) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

  // Construct the final user message
  let userContent = '';
  if (currentUserInput) {
    userContent = `我的最新回答是：【${currentUserInput}】\n请对我进行裁判。当前你需要引导的【下一步任务】是：【${nextTask}】\n请严格返回 JSON。`;
  } else {
    // Initial start case
    userContent = `（对话开始）请根据 SYSTEM_RULES 的要求，基于以下任务对我进行第一轮提问：\n任务目标：【${nextTask}】\n请严格返回 JSON。`;
  }

  const finalUserMessage = {
    role: 'user',
    content: userContent,
  };

  const messages = [systemMessage, ...historyMessages, finalUserMessage];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.6,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    if (!reply) {
      throw new Error('Empty response from LLM');
    }

    return reply;
  } catch (error) {
    console.error('LLM Service Error:', error);
    throw error;
  }
};
