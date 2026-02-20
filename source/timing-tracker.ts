export type PerformanceStats = {
  inputTokens: number;
  outputTokens: number;
  ttft: number;
  tokPerSec: number;
};

class PerformanceTracker {
  private startTime: Date;
  private firstTokenTime: Date | null = null;
  private endTime: Date | null = null;

  constructor() {
    this.startTime = new Date();
  }

  onToken(content: string, type: "reasoning" | "content" | "tool"): void {
    const now = new Date();

    if (this.firstTokenTime == null) {
      this.firstTokenTime = now;
    }
  }

  getStats(inputTokens: number, outputTokens: number): PerformanceStats | null {
    if (this.firstTokenTime == null) {
      return null;
    }

    const endTime = this.endTime ?? new Date();
    const ttft = this.firstTokenTime.getTime() - this.startTime.getTime();
    const streamElapsed = endTime.getTime() - this.firstTokenTime.getTime();

    return {
      inputTokens,
      outputTokens,
      ttft,
      tokPerSec: streamElapsed > 0 ? (outputTokens / streamElapsed) * 1000 : 0,
    };
  }

  end(): void {
    if (this.endTime == null) {
      this.endTime = new Date();
    }
  }
}

export { PerformanceTracker };

export function formatPerformanceStats(stats: PerformanceStats): string {
  const parts: string[] = [];

  if (stats.ttft > 0) {
    parts.push(`TTFT: ${(stats.ttft / 1000).toFixed(3)}s`);
  }

  if (stats.inputTokens > 0) {
    parts.push(`${stats.inputTokens} in`);
  }

  if (stats.outputTokens > 0) {
    parts.push(`${stats.outputTokens} out`);
  }

  if (stats.tokPerSec > 0) {
    parts.push(`${stats.tokPerSec.toFixed(1)} tok/s`);
  }

  return parts.join(" | ");
}
