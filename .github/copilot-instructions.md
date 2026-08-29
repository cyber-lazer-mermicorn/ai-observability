# Copilot Instructions — AI Observability

## Always
- Emit spans with `llm.model`, `llm.provider`, `llm.input_tokens`, `llm.output_tokens`, `llm.cost_usd`
- Calculate cost via `lib/cost/calculator.ts`
- Define alerts in `alerts/` YAML
- Store dashboard JSON in `dashboards/`

## Never
- Hardcode token pricing inline
- Skip `llm.cost_usd` on any LLM span
- Mix metric collection with business logic
