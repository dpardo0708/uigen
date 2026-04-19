# CLAUDE.md
<!-- UIGen: AI-powered React component generator that lets users describe UI in natural language and instantly previews the result in a live iframe sandbox. -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps + Prisma generate + migrate
npm run dev            # Start dev server (Turbopack)
npm run build          # Production build
npm run test           # Run all tests (Vitest)
npm run lint           # ESLint
npm run db:reset       # Reset SQLite database
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/MessageList.test.tsx
```

## Environment

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it, the app falls back to a `MockLanguageModel` that returns canned responses (see [src/lib/provider.ts](src/lib/provider.ts)).

## Architecture

UIGen is an AI-powered React component generator with a live preview. Users describe components in a chat interface; Claude generates/edits files in a virtual file system; the result renders in an iframe sandbox.

### Request Flow

1. User sends message → `POST /api/chat` ([src/app/api/chat/route.ts](src/app/api/chat/route.ts))
2. Route calls Claude with system prompt ([src/lib/prompts/generation.tsx](src/lib/prompts/generation.tsx)) and two tools:
   - `str_replace_editor` — `view`, `create`, `str_replace`, `insert` on virtual files (`undo_edit` is a no-op)
   - `file_manager` — `rename`, `delete` files
3. Streaming response handled by Vercel AI SDK `useChat` hook in [src/lib/contexts/chat-context.tsx](src/lib/contexts/chat-context.tsx)
4. Tool calls trigger `onToolCall` → updates `VirtualFileSystem` in [src/lib/contexts/file-system-context.tsx](src/lib/contexts/file-system-context.tsx)

### Virtual File System

[src/lib/file-system.ts](src/lib/file-system.ts) — in-memory tree, fully serializable to JSON. No disk I/O. Shared between Claude (via tools), the Monaco editor, and the preview. Projects are persisted by serializing the FS to a JSON string in SQLite.

### Preview Pipeline

[src/components/preview/PreviewFrame.tsx](src/components/preview/PreviewFrame.tsx) — on each file change:
1. Files run through [src/lib/transform/jsx-transformer.ts](src/lib/transform/jsx-transformer.ts) (Babel, JSX → ES modules)
2. An import map is constructed for dependency resolution
3. An HTML document with script injection is generated and written into an `<iframe>` sandbox

Entry point is discovered in order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`, then falls back to the first `.jsx`/`.tsx` file found.

The preview iframe injects Tailwind CSS via CDN (`cdn.tailwindcss.com`). Third-party npm packages referenced in generated components are resolved from `esm.sh` at runtime — they do not need to be locally installed.

### Authentication

JWT stored in httpOnly cookies. Middleware ([src/middleware.ts](src/middleware.ts)) protects `/[projectId]` routes. Anonymous mode is fully supported — projects are ephemeral until the user signs up. Anonymous work (messages + file system snapshot) is preserved in `sessionStorage` via [src/lib/anon-work-tracker.ts](src/lib/anon-work-tracker.ts) and can be migrated on sign-up. Server actions live in [src/actions/](src/actions/).

### Data Model

Prisma + SQLite ([prisma/schema.prisma](prisma/schema.prisma)):
- `User` — email/bcrypt password
- `Project` — `messages` and `data` (VirtualFileSystem) stored as JSON strings

The Prisma client is generated to `src/generated/prisma` (not the default `node_modules/@prisma/client`); always import from `@/generated/prisma` or use the shared singleton at [src/lib/prisma.ts](src/lib/prisma.ts).

### Key Paths

| Concern | Location |
|---|---|
| AI model config / mock fallback | [src/lib/provider.ts](src/lib/provider.ts) |
| Claude system prompt | [src/lib/prompts/generation.tsx](src/lib/prompts/generation.tsx) |
| Tool implementations | [src/lib/tools/](src/lib/tools/) |
| Chat state (useChat) | [src/lib/contexts/chat-context.tsx](src/lib/contexts/chat-context.tsx) |
| File system state | [src/lib/contexts/file-system-context.tsx](src/lib/contexts/file-system-context.tsx) |
| UI components | [src/components/](src/components/) (chat/, editor/, preview/, auth/, ui/) |
| shadcn/ui primitives | [src/components/ui/](src/components/ui/) — generated, avoid hand-editing |

### Model

Uses `claude-haiku-4-5` via `@ai-sdk/anthropic` (Vercel AI SDK), with a max of 40 agentic steps per turn.
