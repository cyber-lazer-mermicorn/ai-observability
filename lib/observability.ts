import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Logger
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  async info(message: string, data?: any) {
    await this.log('info', message, data);
  }

  async warn(message: string, data?: any) {
    await this.log('warn', message, data);
  }

  async error(message: string, error?: any) {
    await this.log('error', message, { error: error?.message });
  }

  private async log(level: string, message: string, data?: any) {
    await supabase.from('logs').insert({
      level,
      context: this.context,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

// Metrics Collector
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number) {
    const existing = this.metrics.get(metric) || [];
    existing.push(value);
    this.metrics.set(metric, existing);
  }

  getAverage(metric: string): number {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getP95(metric: string): number {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
  }

  async flush() {
    for (const [metric, values] of this.metrics) {
      await supabase.from('metrics').insert({
        metric,
        values,
        avg: this.getAverage(metric),
        p95: this.getP95(metric),
        timestamp: new Date().toISOString(),
      });
    }
    this.metrics.clear();
  }
}

// Tracer
export class Tracer {
  private traces: Map<string, { start: number; spans: any[] }> = new Map();

  startTrace(traceId: string) {
    this.traces.set(traceId, { start: Date.now(), spans: [] });
  }

  addSpan(traceId: string, name: string, duration: number) {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.spans.push({ name, duration });
    }
  }

  async endTrace(traceId: string) {
    const trace = this.traces.get(traceId);
    if (trace) {
      const totalDuration = Date.now() - trace.start;
      await supabase.from('traces').insert({
        trace_id: traceId,
        duration: totalDuration,
        spans: trace.spans,
        timestamp: new Date().toISOString(),
      });
      this.traces.delete(traceId);
    }
  }
}

// AI Monitor
export class AIMonitor {
  private logger: Logger;
  private metrics: MetricsCollector;
  private tracer: Tracer;

  constructor() {
    this.logger = new Logger('ai-monitor');
    this.metrics = new MetricsCollector();
    this.tracer = new Tracer();
  }

  async trackRequest(provider: string, model: string, latency: number, tokens: number) {
    this.metrics.record(`${provider}.latency`, latency);
    this.metrics.record(`${provider}.tokens`, tokens);
    await this.logger.info('AI request', { provider, model, latency, tokens });
  }

  async trackError(provider: string, error: any) {
    await this.logger.error('AI error', error);
    this.metrics.record(`${provider}.errors`, 1);
  }

  getMetrics() {
    return {
      latency: {
        avg: this.metrics.getAverage('openai.latency'),
        p95: this.metrics.getP95('openai.latency'),
      },
    };
  }
}
