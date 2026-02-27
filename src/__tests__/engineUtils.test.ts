import { buildThinkingPartnerPrompt, callThinkingPartner, mockThinkingPartnerReply } from '../lib/engineUtils';
import { SYSTEM_RULES } from '../config/promptsConfig';
import { llmLogger } from '../utils/logger';

// Mock dependencies
jest.mock('../utils/logger', () => ({
  llmLogger: {
    log: jest.fn(),
  },
}));

describe('DeepMiner Engine Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('buildThinkingPartnerPrompt', () => {
    it('should construct initial prompt correctly', () => {
      const nextTask = 'Test Task';
      const prompt = buildThinkingPartnerPrompt('', nextTask, []);

      expect(prompt).toHaveLength(2);
      expect(prompt[0]).toEqual({ role: 'system', content: SYSTEM_RULES });
      expect(prompt[1].role).toBe('user');
      expect(prompt[1].content).toContain('当前是对话开始');
      expect(prompt[1].content).toContain(nextTask);
    });

    it('should include history in prompt', () => {
      const history: any[] = [
        { type: 'user', content: 'User 1' },
        { type: 'system', content: 'Assistant 1' }
      ];
      const nextTask = 'Task 2';
      const userInput = 'User 2';
      
      const prompt = buildThinkingPartnerPrompt(userInput, nextTask, history);

      expect(prompt).toHaveLength(4); // System + History(2) + User
      expect(prompt[0].role).toBe('system');
      expect(prompt[1]).toEqual({ role: 'user', content: 'User 1' });
      expect(prompt[2]).toEqual({ role: 'assistant', content: 'Assistant 1' });
      expect(prompt[3].role).toBe('user');
      expect(prompt[3].content).toContain(userInput);
      expect(prompt[3].content).toContain(nextTask);
    });
  });

  describe('callThinkingPartner', () => {
    const mockMessages = [{ role: 'user', content: '当前用户回答：Test。下一步你的任务是：Task' }];

    it('should use mock reply when no API key provided', async () => {
      const config = { apiKey: '', provider: 'openai' };
      const reply = await callThinkingPartner(mockMessages, config);

      expect(reply).toContain('我听懂了');
      expect(llmLogger.log).toHaveBeenCalledWith('request', expect.objectContaining({ type: 'mock' }));
    });

    it('should call fetch when API key is provided', async () => {
      const config = { apiKey: 'test-key', provider: 'openai', baseUrl: 'https://api.test', model: 'gpt-4' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'LLM Reply' } }], usage: {} }),
      });

      const reply = await callThinkingPartner(mockMessages, config);

      expect(reply).toBe('LLM Reply');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"messages":'),
        })
      );
      expect(llmLogger.log).toHaveBeenCalledWith('request', expect.objectContaining({ type: 'api' }));
    });

    it('should fallback to mock on API error', async () => {
      const config = { apiKey: 'test-key', provider: 'openai' };
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const reply = await callThinkingPartner(mockMessages, config);

      expect(reply).toContain('我听懂了'); // Fallback
      expect(llmLogger.log).toHaveBeenCalledWith('error', expect.any(Error));
    });
  });
});
