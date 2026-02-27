export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  payload: any;
}

class LLMLogger {
  private logs: LogEntry[] = [];
  private listeners: ((log: LogEntry) => void)[] = [];

  log(type: LogEntry['type'], payload: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type,
      payload,
    };
    this.logs.push(entry);
    this.listeners.forEach(l => l(entry));
    
    // In dev mode, print to console
    const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    if (isDev) {
      console.group(`[LLM ${type.toUpperCase()}]`);
      console.log(payload);
      console.groupEnd();
    }
  }

  getLogs() {
    return this.logs;
  }

  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear() {
    this.logs = [];
  }
}

export const llmLogger = new LLMLogger();
