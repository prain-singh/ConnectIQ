# ConnectIQ

An AI-powered career ecosystem platform that transforms interview preparation and hiring into a continuous, intelligent, and bias-aware experience.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI/ML**: Google Gemini (via API), MediaPipe (Client-side Vision), Web Speech API.

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Features Implemented So Far
- **Landing Page**: High-impact visuals, animated hero section, features grid.
- **Global Theme**: Dark mode optimized, premium "Outfit" typography, glassmorphism effects.
- **Supabase Integration**: Utility functions for Client and Server components + Middleware for session management.

## Roadmap
- [ ] Authentication (Google OAuth)
- [ ] User Dashboard
- [ ] AI Mock Interview Engine (Speech-to-Text, LLM Integration, TTS)
- [ ] Multimodal Analysis (Video/Audio)
- [ ] Collaborative Coding Environment
