## Antigravity review

- Call `ask_antigravity` for a second opinion:
  - After writing an implementation plan (before coding)
  - After a change of 1+ files or 30+ lines (before commit)
- Include:
  - Plan: goal, target files, approach
  - Diff: `git diff` output in the prompt
- Judge each finding and report what you accepted and why. Do not accept all findings blindly.
- On 429 / quota errors: report it and continue without review. Do not retry.
- Review is read-only. Never ask Antigravity to edit files.

## Limit Claude usage

- Locate target files and functions with Grep / Glob before reading.
- For large files, read only the needed range with offset / limit.
- Do not re-read a file already in context unless it changed.
- Pipe long command output through `head` / `tail` / `grep`.
- Do not start subagents just for research. Do small research directly.
- Keep final reports short: changes, verification, open issues.
- Suggest `/clear` when switching to unrelated work; suggest `/compact` when the session gets long.
- Skip `ask_antigravity` for small fixes (a few lines).
