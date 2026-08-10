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
    try {
      await this.log('info', message, data);
    } catch (error: any) {
      throw new Error(`Logger info error: ${error?.message || 'Unknown error'}`);
    }
  }

  async warn(message: string, data?: any) {
    try {
      await this.log('warn', message, data);
    } catch (error: any) {
      throw new Error(`Logger warn error: ${error?.message || 'Unknown error'}`);
    }
  }

  async error(message: string, error?: any) {
    try {
      await this.log('error', message, { error: error?.message });
    } catch (err: any) {
      throw new Error(`Logger error: ${err?.message || 'Unknown error'}`);
    }
  }

  private async log(level: string, message: string, data?: any) {
    try {
      await supabase.from('logs').insert({
        level,
        context: this.context,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      throw new Error(`Log insert error: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Metrics Collector
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number) {
    try {
      const existing = this.metrics.get(metric) || [];
      existing.push(value);
      this.metrics.set(metric, existing);
    } catch (error: any) {
      throw new Error(`Record metric error: ${error?.message || 'Unknown error'}`);
    }
  }

  getAverage(metric: string): number {
    try {
      const values = this.metrics.get(metric) || [];
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    } catch (error: any) {
      throw new Error(`Get average error: ${error?.message || 'Unknown error'}`);
    }
  }

  getP95(metric: string): number {
    try {
      const values = this.metrics.get(metric) || [];
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * 0.95)];
    } catch (error: any) {
      throw new Error(`Get P95 error: ${error?.message || 'Unknown error'}`);
    }
  }

  async flush() {
    try {
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
    } catch (error: any) {
      throw new Error(`Flush metrics error: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Tracer
export class Tracer {
  private traces: Map<string, { start: number; spans: any[] }> = new Map();

  startTrace(traceId: string) {
    try {
      this.traces.set(traceId, { start: Date.now(), spans: [] });
    } catch (error: any) {
      throw new Error(`Start trace error: ${error?.message || 'Unknown error'}`);
    }
  }

  addSpan(traceId: string, name: string, duration: number) {
    try {
      const trace = this.traces.get(traceId);
      if (trace) {
        trace.spans.push({ name, duration });
      }
    } catch (error: any) {
      throw new Error(`Add span error: ${error?.message || 'Unknown error'}`);
    }
  }

  async endTrace(traceId: string) {
    try {
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
    } catch (error: any) {
      throw new Error(`End trace error: ${error?.message || 'Unknown error'}`);
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
    try {
      this.metrics.record(`${provider}.latency`, latency);
      this.metrics.record(`${provider}.tokens`, tokens);
      await this.logger.info('AI request', { provider, model, latency, tokens });
    } catch (error: any) {
      throw new Error(`Track request error: ${error?.message || 'Unknown error'}`);
    }
  }

  async trackError(provider: string, error: any) {
    try {
      await this.logger.error('AI error', error);
      this.metrics.record(`${provider}.errors`, 1);
    } catch (err: any) {
      throw new Error(`Track error error: ${err?.message || 'Unknown error'}`);
    }
  }

  getMetrics() {
    try {
      return {
        latency: {
          avg: this.metrics.getAverage('openai.latency'),
          p95: this.metrics.getP95('openai.latency'),
        },
      };
    } catch (error: any) {
      throw new Error(`Get metrics error: ${error?.message || 'Unknown error'}`);
    }
  }
}
