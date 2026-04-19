# Warp Headcount Planner

Plan hires month by month, enter your financials, and see exactly how each role shifts your runway.

**Live: [warp-headcount-planner.vercel.app](https://warp-headcount-planner.vercel.app)**

## Tech stack

### Frontend (`frontend/`)

- **React 19** with the React Compiler enabled (via `babel-plugin-react-compiler`)
- **Vite 8** + **TypeScript 6**
- **Tailwind CSS v4** with **shadcn/ui** primitives (built on **Radix UI**)
- **Zustand** for client state
- **D3** for the runway chart
- **lz-string** for URL-shareable scenario encoding
- **PostHog** for product analytics
- Deployed on **Vercel**

### Backend (`backend/`)

- **Cloudflare Workers** with the **Hono** framework
- **Workers AI** via the **Vercel AI SDK** (`ai` + `workers-ai-provider`) for the runway insight card
- **D1** (SQLite) for saved scenarios and share-email records
- **R2** for hosting rendered runway chart PNGs (so email clients render them)
- **Cloudflare Email** bindings for sending runway decks
- Deployed via **Wrangler**

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev
```
