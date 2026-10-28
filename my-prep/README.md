# my-prep — Amin's SAA-C03 sprint

Personal layer on top of the study guide: plan, interactive playbooks, progress tracking and sync. Exam: **Tue 10 Nov 2026**.

| File | What it is |
|---|---|
| [index.html](index.html) | **Dashboard**: today's tasks, mock log + trend, go/no-go, playbook progress, module confidence, daily log, report for Claude, sync setup |
| [studybook.html](studybook.html) | Notes (16 topics), decoder, flashcards, 298-question practice, timed mock, the plan checklist |
| [PLAN.md](PLAN.md) · [plan.js](plan.js) | The 29 Oct → 10 Nov plan (plan.js is the single source the pages read) |
| [playbooks/](playbooks/) | 13 interactive playbooks: IAM, Security, Networking, Storage, EC2 & scaling, Serverless & containers, Database, App Integration, Monitoring, Migration & Transfer, Analytics, Architecture patterns, Cost Optimization |
| [mock-exam-a.html](mock-exam-a.html) | 65 original exam-style questions, 130-minute timer, domain breakdown |
| [progress.js](progress.js) | Shared progress layer: tracks every page's saved state, syncs it to `progress/progress.json`, builds the report |

## How progress is saved

1. **Always:** every page saves to your browser's local storage (same site = shared between pages).
2. **Sync (optional, recommended):** on the dashboard → *Sync across devices*, paste a fine-grained GitHub token with **Contents: read and write** on this repo only. Each device then pushes changes ~20 s after you stop clicking and pulls on open. Newest change per item wins.
3. **The file:** `progress/progress.json` holds the raw data, a computed `summary`, and `report_md` — a Markdown report. Pushes to `progress/` don't trigger a Pages rebuild.

## Asking Claude for feedback

- With sync: say **"check my progress"** in the SAA project. Claude reads `progress/progress.json` from this repo.
- Without sync: dashboard → *Share with Claude* → **Copy report**, paste it in the chat.
- Write questions for Claude in the *Notes for Claude* box; they travel with the report.

## Notes

- Progress made inside the claude.ai artifact versions of the playbooks lives on claude.ai, not here; it doesn't carry over.
- Questions from your uploaded Tutorials-Dojo-style bank were left out of this public studybook on purpose (they read as real exam content). The claude.ai studybook artifact still has them.
- Token safety: the token is stored only in the browser you paste it into. Scope it to this one repo and Contents only, with a short expiry. "Remove token from this browser" on the dashboard deletes it.
