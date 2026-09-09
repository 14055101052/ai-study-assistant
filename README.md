# AI Study Assistant

A full-stack AI-powered study companion. Students can organize subjects, create notes, chat with an AI assistant, generate quizzes, and track study progress.

## Features

- **Authentication**: JWT-based auth with HTTP-only cookies, bcrypt password hashing
- **Subjects & Topics**: Create subjects with colors, add topics, mark as completed
- **Study Notes**: Create, edit, search, and filter notes by topic/subject
- **Progress Tracking**: Dashboard with per-subject progress bars, stats overview
- **AI Chat**: Three modes — general chat, concept explanation, topic summarization
- **AI Quizzes**: Generate MCQ quizzes from your study material with explanations
- **Quiz Player**: Take quizzes, see correct/incorrect answers, track scores

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + React Router 6, Tailwind CSS |
| Backend | Express.js (Node.js) |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jose) + bcryptjs |
| AI | OpenAI-compatible API (server-side HTTPS) |
| Build | esbuild |

## Setup

```bash
git clone https://github.com/14055101052/ai-study-assistant.git
cd ai-study-assistant
npm install
cp .env.example .env  # Add your OPENAI_API_KEY
```

### Environment Variables

```env
JWT_SECRET="your-secret-at-least-32-chars"
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
```

Any OpenAI-compatible API works (OpenAI, Groq, Together AI, etc.).

### Build & Run

```bash
# Build frontend
node -e "require('esbuild').build({entryPoints:['src/main.jsx'],bundle:true,outfile:'public/app.js',format:'esm',jsx:'automatic',jsxImportSource:'react',loader:{'.jsx':'jsx','.js':'jsx'},define:{'process.env.NODE_ENV':JSON.stringify('production')},minify:true}).then(()=>console.log('Build done'))"

# Start server (serves API + frontend on port 3000)
node server/index.js
```

App runs at `http://localhost:3000`.

## API Endpoints

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `GET/POST /api/subjects`, `GET/PATCH/DELETE /api/subjects/:id`
- `GET/POST /api/topics`, `PATCH/DELETE /api/topics/:id`
- `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/:id`
- `GET/POST/DELETE /api/chat`
- `GET/POST /api/quiz`, `POST /api/quiz/generate`, `GET/PATCH/DELETE /api/quiz/:id`
- `GET /api/dashboard`

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT in HTTP-only cookies (7-day expiry)
- Every route checks user ownership
- API keys stay server-side, never exposed to client

## License

MIT
