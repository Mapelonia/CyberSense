# 🛡️ CyberSense

**Interactive Social Engineering Training Platform**

CyberSense is a web-based platform that simulates real-world social engineering attacks — phishing, vishing, and pretexting — to strengthen human defenses against cyber threats. Practice identifying manipulation tactics in a safe, gamified environment.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?logo=prisma)

---

## ✨ Features

### Three Simulation Types

- **📧 Phishing Emails** — Inspect simulated emails, click on suspicious elements to flag red flags, and decide if they're malicious or safe
- **💬 Pretexting Chats** — Navigate interactive conversations where social engineers try to manipulate you into revealing information
- **📞 Vishing Calls** — Analyze phone call transcripts and participate in interactive voice scenarios with a phone UI

### Template-Driven Scenario Engine

- Randomized scenario generation using pre-written templates with variable substitution
- 16+ unique scenario templates across all three types
- Manipulation tactic patterns: urgency, authority, fear, curiosity, reward, trust
- Unlimited variety — no two sessions are identical

### Full Gamification System

- **XP & Levels** — Earn points scaled by difficulty, progress through 5 ranks (Beginner → Expert)
- **Daily Streaks** — Maintain practice streaks for bonus XP multipliers
- **15+ Badges** — Unlock achievements for milestones, mastery, and special accomplishments
- **Leaderboard** — Compete globally with other users

### Adaptive Feedback Engine

- Instant feedback after every scenario with red flag breakdown
- Catches vs. misses annotated with explanations
- Tactic-specific tips tailored to your personal weakness patterns
- Historical tracking of which manipulation tactics trip you up most

### Authentication

- Email/password registration with secure bcrypt hashing
- Google OAuth sign-in
- GitHub OAuth sign-in
- JWT-based sessions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon - serverless) |
| ORM | Prisma |
| Auth | NextAuth.js |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

**All services are free tier** — $0/month to run.

---

## 📁 Project Structure

```
cybersense/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   │   └── signup/route.ts          # Registration endpoint
│   │   │   ├── leaderboard/route.ts         # Global leaderboard
│   │   │   ├── scenarios/
│   │   │   │   ├── generate/route.ts        # Scenario generation
│   │   │   │   └── submit/route.ts          # Submit results + XP
│   │   │   └── user/
│   │   │       ├── badges/check/route.ts    # Badge unlock check
│   │   │       ├── stats/route.ts           # User gamification stats
│   │   │       └── weaknesses/route.ts      # Adaptive feedback data
│   │   ├── dashboard/page.tsx               # Main user dashboard
│   │   ├── login/page.tsx                   # Login page
│   │   ├── signup/page.tsx                  # Registration page
│   │   ├── simulate/
│   │   │   ├── phishing/page.tsx            # Phishing simulation
│   │   │   ├── pretexting/page.tsx          # Pretexting simulation
│   │   │   └── vishing/page.tsx             # Vishing simulation
│   │   ├── globals.css                      # Global styles + CSS variables
│   │   ├── layout.tsx                       # Root layout
│   │   └── page.tsx                         # Landing page
│   ├── components/
│   │   ├── providers/auth-provider.tsx      # Session provider
│   │   ├── simulations/
│   │   │   ├── feedback-panel.tsx           # Reusable feedback display
│   │   │   └── phishing-email-viewer.tsx    # Email rendering component
│   │   └── ui/                              # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── progress.tsx
│   ├── lib/
│   │   ├── auth.ts                          # NextAuth configuration
│   │   ├── feedback-engine.ts               # Adaptive feedback logic
│   │   ├── gamification.ts                  # XP, levels, badges, streaks
│   │   ├── prisma.ts                        # Prisma client singleton
│   │   ├── scenario-engine.ts               # Template engine + randomization
│   │   └── utils.ts                         # Utility functions (cn)
│   └── templates/
│       ├── phishing.json                    # 6 phishing email templates
│       ├── pretexting.json                  # 5 pretexting chat templates
│       └── vishing.json                     # 5 vishing call templates
├── .env.example                             # Environment variable template
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn**
- A **Neon** account (free): https://neon.tech
- Google and/or GitHub OAuth credentials (optional, for social login)

### 1. Clone and Install

```bash
git clone <your-repo-url> cybersense
cd cybersense
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (get from Neon dashboard)
DATABASE_URL="postgresql://user:pass@host.neon.tech/cybersense?sslmode=require"

# NextAuth (generate secret with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# OAuth (optional - app works without these)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. Set Up Database

```bash
npx prisma db push
```

This creates all tables in your Neon database.

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🔐 OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

---

## 🌐 Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - CyberSense platform"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — Your Neon connection string
   - `NEXTAUTH_URL` — Your Vercel domain (e.g., `https://cybersense.vercel.app`)
   - `NEXTAUTH_SECRET` — Your secret key
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (optional)
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (optional)
3. Deploy!

### 3. Update OAuth Redirect URIs

Update your Google/GitHub OAuth settings to include your production URL:
- `https://your-domain.vercel.app/api/auth/callback/google`
- `https://your-domain.vercel.app/api/auth/callback/github`

---

## 🎮 How It Works

### Scenario Flow

1. User selects a simulation type (phishing, pretexting, or vishing)
2. The template engine picks a random template, fills in variables, and generates a unique scenario
3. User interacts with the scenario (flags red flags, makes choices, identifies tactics)
4. Results are submitted → XP calculated → streak updated → badges checked
5. Adaptive feedback panel shows what was caught, what was missed, and personalized tips

### Gamification Model

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Beginner | 0 |
| 2 | Novice | 500 |
| 3 | Intermediate | 1,500 |
| 4 | Advanced | 3,500 |
| 5 | Expert | 7,000 |

**XP Formula:** `Base (50) × Difficulty Multiplier × (1 + Streak Bonus + Flag Bonus + Speed Bonus)`

### Manipulation Tactics Tracked

- 🚨 **Urgency** — Time pressure to act without thinking
- 👔 **Authority** — Impersonating officials or executives
- 😰 **Fear** — Threats and consequences
- 🔍 **Curiosity** — Luring with exclusive or intriguing offers
- 🎁 **Reward** — Too-good-to-be-true promises
- 🤝 **Trust** — Building false rapport or impersonating known entities

---

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (DB GUI)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built to strengthen human defenses against cyber threats. 🛡️
