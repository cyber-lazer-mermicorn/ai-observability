# AI Observability — Agent Doctrine

## What this repo is
Production-grade AI observability: OpenTelemetry traces, LLM-specific metrics, cost tracking, latency dashboards.
By Cherry Shanaley (Chan), AI Solutions Engineer.

## Tech stack
- TypeScript strict, Next.js 15, OpenTelemetry SDK, Vercel
- Metrics backend: configurable (Grafana / Datadog / console exporter)

## Coding rules
- All LLM calls emit a span with: `llm.model`, `llm.provider`, `llm.input_tokens`, `llm.output_tokens`, `llm.cost_usd`
- Never calculate cost inline — use `lib/cost/calculator.ts` with the pricing table
- Dashboards in `dashboards/` as JSON — importable to Grafana
- Alerts defined in `alerts/` as YAML
- No hardcoded pricing — pricing table in `lib/cost/pricing.ts`, updated from provider docs

## Commands
```bash
npm install && npm run dev
npm run test
npm run export-dashboard  # export Grafana JSON
```
