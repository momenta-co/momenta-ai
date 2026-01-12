# Momenta Intelligence Layer

An AI-powered recommendation engine for memorable experiences built with Next.js 15+ and TypeScript.

## Overview

Momenta is a decision-making system designed to scale human criteria for memorable experiences. This project implements an explainable recommendation engine that:

1. Takes user context (occasion, who, mood, budget, city)
2. Returns top 3-5 experiences with scores and reasoning
3. Shows "Why Momenta chose this" to users

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **PostgreSQL** (existing DB - not yet integrated)
- **OpenAI API** (GPT-4o-mini - not yet integrated)
- **Zod** - Schema validation
- **Tailwind CSS** - Styling

## Project Structure

```
src/
├── lib/
│   └── intelligence/
│       ├── types.ts           # TypeScript interfaces
│       ├── schema.ts          # Zod validation schemas
│       ├── prompt-builder.ts  # OpenAI prompt construction
│       └── fallback.ts        # Simple scoring fallback
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # POST /api/chat (AI-powered chat with tools)
│   └── (dashboard)/
│       └── intelligence-demo/
│           └── page.tsx       # Demo UI
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your values:
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   PROMPT_VERSION=v0.1
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the home page.

Visit [http://localhost:3000/intelligence-demo](http://localhost:3000/intelligence-demo) to try the demo.

### Build

Create a production build:

```bash
npm run build
npm start
```

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

## Core Concepts

### User Context

The system takes user input describing their desired experience:

```typescript
{
  occasion: "Cita romántica",
  withWho: "Pareja",
  mood: "Relajado",
  budget: 150000,
  city: "Bogotá"
}
```

### Scoring Breakdown

Each experience is scored across multiple dimensions (0-100):

- **Occasion**: How well does it fit the occasion?
- **Relation**: Is it suitable for who they're with?
- **Mood**: Does it align with their desired mood?
- **Budget**: Is it within budget?
- **Total**: Average of all dimensions

### Recommendations

The API returns top 3-5 experiences with:
- Complete experience details
- Score breakdown across all dimensions
- 2-4 specific reasons explaining "Why Momenta chose this"

## API Endpoints

### POST /api/chat

AI-powered chat endpoint with tool integration for personalized recommendations.

The chat endpoint uses AI SDK tools to handle user conversations and generate recommendations inline:
- `getRecommendations` - Generates personalized experience recommendations based on user context
- `requestFeedback` - Collects user feedback on recommendations

Recommendations are returned as part of the chat conversation flow, with the AI explaining its choices and reasoning.

## Current Implementation Status

### ✅ Completed (v0.2)

- Folder structure and architecture
- TypeScript types and Zod schemas
- **OpenAI API integration** (GPT-4o-mini via AI SDK)
- Fallback scoring system (heuristic-based)
- Automatic fallback when OpenAI unavailable
- API endpoint with validation
- Demo UI with form and results display
- Model indicator in UI (shows AI vs Fallback)
- Build system and configuration

### 🚧 Not Yet Implemented

- PostgreSQL database connection
- User authentication
- Experience data management
- Production deployment configuration

## Development Notes

### OpenAI Integration

The system now uses OpenAI's GPT-4o-mini model via the AI SDK:

1. **AI Service** (`src/lib/intelligence/ai-service.ts`):
   - Uses `generateObject` from AI SDK for structured output
   - Validates responses with Zod schemas
   - Automatically falls back to heuristic scoring on error

2. **Smart Prompting** (`src/lib/intelligence/prompt-builder.ts`):
   - System prompt defines Momenta's decision engine personality
   - User prompt includes context + available experiences
   - Enforces JSON output format with scoring rules

3. **Graceful Degradation**:
   - If `OPENAI_API_KEY` is not set → uses fallback
   - If API call fails → uses fallback
   - UI shows which model was used (green badge for AI, orange for fallback)

### Mock Data

The demo uses a subset of experiences from `data/experiences.json`. In production, this would come from the PostgreSQL database.

### Fallback System

The fallback system provides recommendations when OpenAI is unavailable:
- Keyword matching for categories
- Price range comparison
- Simple scoring algorithm

This ensures the system always returns results, even without API access.

### Next Steps

1. Connect to PostgreSQL database
2. Implement experience data CRUD operations
3. Add user authentication
4. Improve prompt engineering for better recommendations
5. Deploy to production environment

## License

Private - Momenta Boutique
