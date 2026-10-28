# progress/

`progress.json` is written by the sprint dashboard (`my-prep/progress.js`) through the GitHub API. Don't edit it by hand.

- `summary` — computed snapshot: plan tasks, mocks, playbook quiz scores, module stats, weakest modules, daily log, notes.
- `report_md` — the same as a readable Markdown report (what Claude reads first).
- `data` — raw browser storage per key with a timestamp, used to merge devices (newest wins).

Commits here are skipped by the Pages workflow.
