# Meridian

**The operating system for ambitious teams** — an enterprise project &
work-management platform. Premium marketing site + an interactive product app,
built to a "Swiss Signal" design language (warm paper, ink black, one electric
signal-orange accent, sharp grid, mono numerals).

> Status: **Frontend complete** (marketing + app shell with realistic mock
> data). The backend is intentionally deferred and the data layer is typed so
> AWS (Cognito · DynamoDB · S3 · Amplify) drops in without UI changes.

---

## Stack

| Layer       | Choice                                                              |
| ----------- | ------------------------------------------------------------------- |
| Framework   | **Next.js 16** (App Router, RSC, Turbopack)                         |
| Language    | TypeScript 5, React 19                                              |
| Styling     | **Tailwind CSS v4** (CSS-first `@theme`) + custom design tokens     |
| Components  | **shadcn/ui** on **Base UI** (`@base-ui/react`)                     |
| Motion      | **Framer Motion** (`motion/react`)                                  |
| Icons       | lucide-react                                                        |
| Type system | Archivo (display/UI) + IBM Plex Mono (numerals/labels)              |

### Design skills installed

- `frontend-design` (official Claude skill) — anti-slop design intelligence.
- **Taste-Skill** — `npx skills add Leonxlnx/taste-skill` → 13 skills in
  `.agents/skills/`.
- _UI-UX-Pro-Max_ (`uipro-cli`) — optional, install yourself:
  `npx -p uipro-cli uipro init --ai claude`.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (typecheck + prerender)
npm run lint
```

---

## Routes

| Route            | What it is                                                            |
| ---------------- | --------------------------------------------------------------------- |
| `/`              | Marketing site — hero w/ live board, platform, workflow, interactive Board/Timeline/Dashboard tabs, animated metrics, testimonials, security, pricing, CTA |
| `/app`           | Dashboard — stats, projects, my tasks, activity, team                 |
| `/app/board`     | Kanban board with **native drag-and-drop** + project filters          |
| `/app/timeline`  | Portfolio Gantt with swimlanes + "today" marker                       |
| `/app/team`      | Members table + **invite flow** (Cognito-ready dialog)                |

---

## Project structure

```
app/
  layout.tsx            # fonts (Archivo + IBM Plex Mono), metadata
  globals.css           # Swiss Signal tokens + custom utilities
  page.tsx              # marketing landing
  app/                  # authenticated product (URL: /app)
    layout.tsx          # dark sidebar + topbar shell
    page.tsx            # dashboard
    board/ timeline/ team/
components/
  brand/                # Meridian mark + wordmark
  marketing/            # landing sections (nav, hero, views, pricing, …)
  app/                  # sidebar, topbar, widgets, board/team clients
  ui/                   # shadcn (Base UI) primitives
lib/
  site.ts               # marketing content
  app-data.ts           # typed domain data (Members, Projects, Tasks, …)
  utils.ts              # cn()
```

---

## Wiring the AWS backend (next phase)

The types in `lib/app-data.ts` are modeled for a clean swap to **Amplify Gen 2**:

1. **Scaffold** — `npm create amplify@latest` then define resources:
   - `amplify/auth/resource.ts` → **Cognito** user pool, groups
     (`Owner/Admin/Member/Guest`), email invitations.
   - `amplify/data/resource.ts` → **DynamoDB** via Amplify Data:
     `Workspace`, `Project`, `Task`, `Member`, `Activity` (owner/group auth).
   - `amplify/storage/resource.ts` → **S3** for attachments & avatars,
     keyed `workspaceId/taskId/*`.
2. **Run** — `npx ampx sandbox` (uses *your* AWS credentials) generates
   `amplify_outputs.json`.
3. **Connect** — replace the static arrays with `generateClient<Schema>()`
   queries. The UI components take the same shapes, so nothing else changes.
4. **Invites** — the Team dialog's `invite()` calls
   `adminCreateUser` / `adminAddUserToGroup` on Cognito instead of local state.

---

© Meridian Labs — built for teams that ship.
