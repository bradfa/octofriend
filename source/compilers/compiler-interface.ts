import { ModelConfig } from "../config.ts";
import { AgentResult } from "../ir/llm-ir.ts";
import { JsonFixResponse } from "../prompts/autofix-prompts.ts";
import { LlmIR } from "../ir/llm-ir.ts";
import { LoadedTools } from "../tools/index.ts";
import { PerformanceTracker } from "../timing-tracker.ts";

export type Compiler = (params: {
  systemPrompt?: () => Promise<string>;
  model: ModelConfig;
  apiKey: string;
  irs: LlmIR[];
  onTokens: (t: string, type: "reasoning" | "content" | "tool") => any;
  abortSignal: AbortSignal;
  autofixJson: (badJson: string, signal: AbortSignal) => Promise<JsonFixResponse>;
  tools?: Partial<LoadedTools>;
  performanceTracker?: PerformanceTracker;
}) => Promise<AgentResult>;
