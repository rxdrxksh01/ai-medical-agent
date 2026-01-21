# 🏥 AI Medical Voice Agent

An intelligent medical consultation platform powered by AI voice agents, built with Next.js, Vapi.ai, and Google Gemini.

## ✨ Features

- **🎙️ Voice-Powered Consultations**: Real-time AI doctor conversations using Vapi.ai
- **🤖 Smart Symptom Analysis**: Gemini AI matches symptoms to specialist doctors
- **📊 Consultation History**: Track past sessions with AI-generated medical summaries
- **🔐 Secure Authentication**: Clerk-based user management
- **💾 Persistent Storage**: PostgreSQL database with Drizzle ORM

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI/ML**: Google Gemini API, Vapi.ai Voice SDK
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Clerk
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Language**: TypeScript

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-medical-voice-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys (see Configuration below)

# Push database schema
npm run db:push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ⚙️ Configuration

Create a `.env.local` file with:

```env
# Vapi.ai
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id

# Google Gemini
GEMINI_API_KEY=your_gemini_key

# Database
DATABASE_URL=your_neon_postgres_url

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## 🗂️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── (routes)/          # Protected routes
│   │   ├── dashboard/     # User dashboard
│   │   └── medical-agent/ # Voice consultation UI
│   └── api/               # API routes
├── components/            # Reusable UI components
├── config/               # Database schema
├── lib/                  # Utilities (Gemini, DB)
└── public/               # Static assets
```

## 🎯 Current Status

**Work in Progress** - Active development of:
- ✅ Voice agent integration
- ✅ Symptom-to-doctor matching
- ✅ Session management
- ✅ User authentication
- 🚧 AI medical summary generation (quota-limited)
- 🚧 Enhanced error handling
- 🚧 Mobile responsiveness

## 📝 License

MIT

## 🤝 Contributing

This is a personal learning project. Feedback and suggestions are welcome!
