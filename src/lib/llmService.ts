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
  // But if UI config is empty/default (no apiKey) OR if UI key matches the System Env Key, we fall back to Env (or treat as System).
  
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
      
      // If the key in UI matches the Env Key (which happens if we auto-filled it in context), use it.
      // But if the key in UI is EMPTY (which happens if we cleared it on save to avoid leak), we must fallback to env.
  } else {
      // Case B: No UI config key -> Use Environment Variables
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

  let baseUrl = rawBaseUrl.trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`;
  }

  try {
    const urlObj = new URL(baseUrl);
    if (urlObj.search) {
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

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  let requestEndpoint = endpoint;
  if (process.env.NODE_ENV !== 'production') {
    requestEndpoint = '/__dm_llm_proxy';
    requestHeaders['x-dm-endpoint'] = endpoint;
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
    const response = await fetch(requestEndpoint, {
      method: 'POST',
      headers: requestHeaders,
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
      let errorMsg = `API Error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        const msg = errorJson.message || errorJson.error;
        if (msg) {
            errorMsg += ` - ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`;
            
            // Friendly error messages for common issues
            if (response.status === 403 && (String(msg).includes('balance') || errorJson.code === 30001)) {
                throw new Error('API 账户余额不足 (Error 403)。请检查您的 API 服务商账户余额，或在设置中更换有效的 API Key。');
            }
            if (response.status === 401) {
                throw new Error('API Key 无效或认证失败 (Error 401)。请在系统设置中检查您的 API Key 是否正确。');
            }
        } else {
            errorMsg += ` - ${errorText}`;
        }
      } catch (e) {
        errorMsg += ` - ${errorText}`;
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    if (!reply) {
      throw new Error('Empty response from LLM');
    }

    return reply;
  } catch (error) {
    if (error instanceof TypeError && String(error.message).includes('Failed to fetch')) {
      throw new Error('网络请求失败 (Failed to fetch)。请检查 Base URL 是否包含 https://，并确认目标服务支持浏览器直连；本地开发环境已自动通过同源代理转发。');
    }
    console.error('LLM Service Error:', error);
    throw error;
  }
};
