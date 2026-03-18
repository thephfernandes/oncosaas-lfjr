# Architecture Decision Durability

Use one row per significant architecture decision.

| Date | Decision | Expected Benefit | Evidence Observed | Stress Signals | Durability Verdict | Action |
| ---- | -------- | ---------------- | ----------------- | -------------- | ------------------ | ------ |
| 2026-03-18 | Example: Split AI service from backend | Independent scaling and deployment | Faster model iteration; isolated failures | Added contract maintenance overhead | Holding | Keep, add contract tests |

## Durability Verdicts

- Holding: performs as expected with manageable cost.
- Fragile: works but creates recurring maintenance or reliability issues.
- Failing: regularly causes incidents, regressions, or delivery slowdowns.

## Action Types

- Keep
- Rework
- Replace
- Revert
