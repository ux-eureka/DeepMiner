
export const extractProviderFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const target = urlObj.searchParams.get('target');
    if (!target) return null;
    
    // Extract first segment before slash
    const parts = target.split('/');
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
    return null;
  } catch (e) {
    // Invalid URL
    return null;
  }
};
