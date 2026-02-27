export declare const SYSTEM_RULES: string;

export type PhaseSpec = {
  title: string;
  task: string;
};

export type ModeSpec = {
  id: string;
  name: string;
  phases: Record<string | number, PhaseSpec>;
};

export declare const MODE_CONFIG: Record<string, ModeSpec>;

