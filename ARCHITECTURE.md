# Architecture

## Observability pipeline
LLM call → OTel span (tokens + cost) → exporter → metrics backend → Grafana dashboard.

## Key spans

| Span | Required attributes |
|---|---|
| `llm.call` | model, provider, input_tokens, output_tokens, cost_usd, latency_ms |
| `agent.step` | agent_name, step_index, tool_name, status |
| `rag.retrieve` | query_hash, k, top_score, rerank_applied |

## Cost calculation
`lib/cost/calculator.ts` takes `{ model, inputTokens, outputTokens }` and returns `costUsd` using the pricing table in `lib/cost/pricing.ts`. Update pricing table when providers change rates.
