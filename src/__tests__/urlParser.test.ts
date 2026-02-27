import { extractProviderFromUrl } from '../utils/urlParser';

describe('URL Parser', () => {
  it('should return null for invalid URLs', () => {
    expect(extractProviderFromUrl('invalid-url')).toBeNull();
    expect(extractProviderFromUrl('')).toBeNull();
  });

  it('should return null if target parameter is missing', () => {
    expect(extractProviderFromUrl('https://api.example.com/v1')).toBeNull();
  });

  it('should extract provider from target parameter', () => {
    const url = 'https://cloud.siliconflow.cn/models?target=deepseek-ai/DeepSeek-V3.2';
    expect(extractProviderFromUrl(url)).toBe('deepseek-ai');
  });

  it('should handle different providers', () => {
    expect(extractProviderFromUrl('https://api.test.com?target=openai/gpt-4')).toBe('openai');
    expect(extractProviderFromUrl('https://api.test.com?target=anthropic/claude-3')).toBe('anthropic');
  });

  it('should handle complex URLs', () => {
    const url = 'https://sub.domain.com/path/v1?other=param&target=google/gemini-pro&key=123';
    expect(extractProviderFromUrl(url)).toBe('google');
  });
});
