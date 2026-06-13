# LeadFlow AI

LeadFlow AI is an AI-powered lead automation CRM SaaS foundation for small businesses. It is organized as a monorepo with a Next.js dashboard frontend and an Express, Prisma, PostgreSQL backend.

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, Axios, React Hook Form, Zod, Recharts
- Backend: Express.js, TypeScript, Prisma, PostgreSQL, Zod, JWT, bcryptjs
- AI and messaging integrations: OpenAI, Twilio, Resend
- Data model: multi-tenant CRM entities with leads, messages, appointments, knowledge documents, automations, API keys, and webhook logs

## Setup

1. `cd backend && npm install`
2. `cp .env.example .env` and fill in the required values
3. `npm run db:push`
4. `npm run dev`
5. `cd ../frontend && npm install`
6. `cp .env.local.example .env.local`
7. `npm run dev`

The backend runs on `http://localhost:4000`.

The frontend runs on `http://localhost:3000`.
