# Claude Supervision Playbook

This playbook is for supervising multiple Claude coding instances while preserving speed and quality.

## 1) Operating Loop (Supervisor)

1. Create a swarm with focused ownership:
   - one Claude instance per bounded scope (API, frontend, tests, docs).
2. Define success and failure checks before execution:
   - expected behavior, tests to run, and rollback criteria.
3. Run in short cycles (20-40 min):
   - gather diffs, test output, unresolved risks.
4. Review outcomes:
   - bug introductions, escaped regressions, review time, rework.
5. Update the protocol and architecture scorecards after each cycle.

## 2) Work Partition Protocol

- Partition by file ownership to avoid merge conflicts.
- Require each instance to report:
  - changed files,
  - test commands executed,
  - risks and assumptions,
  - what was not validated.
- Gate merges on:
  - lint/typecheck/tests passing for touched components,
  - multi-tenant safety checks (`tenantId` scope),
  - no new critical logs/errors.

## 3) Protocols That Usually Reduce Bugs

- Small, explicit ownership per instance.
- Mandatory "negative test" for the changed behavior.
- "Evidence first" review: test output and failing case reproduction.
- Decision logs for any schema or contract change.

Track real effect in `protocol-review.md` and keep only what improves results.

## 4) Architecture Durability Review

Use `architecture-review.md` after each milestone/sprint:

- Keep decisions with stable metrics and low rework.
- Rework decisions with recurring incidents or high coupling cost.
- Revert decisions that repeatedly fail under production-like load.

## 5) Commands

Start swarm:

```bash
chmod +x scripts/supervisor/claude-swarm.sh scripts/supervisor/claude-watch.sh
./scripts/supervisor/claude-swarm.sh start 3 claude-swarm "$(pwd)" claude
```

If `tmux` is unavailable on macOS, `start` falls back to opening Terminal tabs/windows (manual lifecycle).

Monitor processes:

```bash
./scripts/supervisor/claude-watch.sh 3
```

Check swarm status:

```bash
./scripts/supervisor/claude-swarm.sh status claude-swarm
```

Attach:

```bash
./scripts/supervisor/claude-swarm.sh attach claude-swarm
```

Stop:

```bash
./scripts/supervisor/claude-swarm.sh stop claude-swarm
```
