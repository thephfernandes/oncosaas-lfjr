# Protocol Review Scorecard

Use one row per supervision protocol experiment.

| Date       | Protocol Change | Hypothesis | Baseline (bugs/PR) | Trial Result (bugs/PR) | Cycle Time Impact | Keep? | Notes |
| ---------- | --------------- | ---------- | ------------------ | ---------------------- | ----------------- | ----- | ----- |
| 2026-03-18 | Example: Require negative test per PR | Fewer regressions on edge cases | 0.8 | 0.4 | +8% | Yes | Reduced escaped bugs in alerts flow |

## Suggested Metrics

- Bugs per PR (or per merge)
- Escaped bugs (found after merge)
- Median review time
- Rework rate (PR reopened or follow-up hotfix)

## Decision Rule

- Keep only protocols that improve quality without unacceptable velocity loss.
- If a protocol adds >20% cycle time with no measurable bug reduction, remove or redesign it.
