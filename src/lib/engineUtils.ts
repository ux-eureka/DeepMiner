import { SYSTEM_RULES } from '../config/promptsConfig';
import { llmLogger } from '../utils/logger';
import { Message } from '../hooks/useDeepMinerEngine';

export const extractFirstQuestion = (task: string) => {
  const cleaned = task.replace(/\s+/g, ' ').trim();
  const m =
    cleaned.match(/(?:追问：|信息：)\s*1\.\s*([^2]+?)(?:\s*2\.|$)/) ||
    cleaned.match(/1\.\s*([^2]+?)(?:\s*2\.|$)/);
  const q = m?.[1]?.trim();
  if (q) return q.replace(/[。；;]$/, '') + '？';
  return cleaned.endsWith('？') ? cleaned : `${cleaned}？`;
};

export const mockThinkingPartnerReply = (userInput: string, nextTask: string) => {
  const trimmed = userInput.trim();
  const feedback = (trimmed && trimmed !== '无')
    ? `我听懂了：你说的核心是“${trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed}”。`
    : '我们先别急着下结论，先把事实坐标钉牢。';
  const setup = '为了把这个判断落到可执行的改动上，下一步必须把关键变量说清楚，否则只能停留在口号层。';
  const question = extractFirstQuestion(nextTask);
  return `${feedback}\n\n${setup}\n\n现在先回答一个最关键的：${question}`;
};

export const buildThinkingPartnerPrompt = (userInput: string, nextTask: string, history: Message[]) => {
  const historyMessages = history.map(m => {
    return {
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    };
  });

  const systemMessage = { role: 'system', content: SYSTEM_RULES };
  
  let userMessageContent = '';
  if (!userInput || userInput === '无') {
    userMessageContent = `（当前是对话开始，用户尚未回答）。下一步你的任务是：${nextTask}`;
  } else {
    userMessageContent = `当前用户回答：${userInput}。下一步你的任务是：${nextTask}`;
  }

  const userMessage = { role: 'user', content: userMessageContent };

  return [systemMessage, ...historyMessages, userMessage];
};

export const callThinkingPartner = async (messages: any[], config: any) => {
  const lastUserMessage = messages[messages.length - 1].content;
  const userInput = lastUserMessage.match(/当前用户回答：([\s\S]*?)。下一步你的任务是：/)?.[1] ?? '';
  const nextTask = lastUserMessage.match(/下一步你的任务是：([\s\S]*)$/)?.[1] ?? '';

  if (!config?.apiKey && config?.provider !== 'custom') {
    llmLogger.log('request', { type: 'mock', messages });
    const reply = mockThinkingPartnerReply(userInput, nextTask);
    llmLogger.log('response', { type: 'mock', reply });
    return reply;
  }

  try {
    const baseUrl = (config.baseUrl || '').replace(/\/$/, '');
    
    llmLogger.log('request', { type: 'api', provider: config.provider, messages });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      llmLogger.log('error', { status: response.status, text: errText });
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    llmLogger.log('response', { type: 'api', reply, usage: data.usage });
    return reply;
  } catch (e) {
    llmLogger.log('error', e);
    // Fallback to mock on error
    return mockThinkingPartnerReply(userInput, nextTask);
  }
};
