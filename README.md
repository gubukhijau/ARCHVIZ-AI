# ARCHVIZ AI — Architectural Photo Realism Studio

A full-stack architectural visualization studio that enhances the photographic realism of architectural renderings, 3D models (SketchUp, Revit, Blender, Rhino), and conceptual sketches while strictly preserving original architectural geometry, proportions, facade openings, and material assignments.

---

## 🌟 Key Features

1. **Strict Design Preservation Architecture**:
   - Zero geometry drift: Maintains building dimensions, columns, beams, roof profiles, and window frames.
   - Material identity preservation: Concrete, timber grain direction, glass transparency/reflections, stone, and tile profiles remain faithful to source models.
   - Master reference adherence: Image editing is strictly constrained using the system prompt constitution.

2. **4 Architectural Lighting & Time Presets**:
   - **PAGI (Morning)**: Soft morning daylight (06:00–09:30), natural ambient illumination, gentle shadows, neutral color reproduction.
   - **SIANG (Noon)**: Balanced natural daylight (11:30–14:00), realistic global illumination, physically plausible shadows, accurate material colors.
   - **SORE (Golden Hour)**: Natural late-afternoon light (16:30–18:00), soft directional illumination, restrained warmth, long architectural shadow transitions.
   - **MALAM (Night)**: Physically plausible night exposure (20:00–23:00), realistic ambient darkness, authentic architectural fixture illumination.

3. **Interactive Comparison Studio**:
   - Dual-layer interactive split slider to compare original source image vs enhanced photorealistic rendering.
   - Side-by-side inspection mode and Fullscreen high-resolution view.
   - Instant high-res download with automatic naming metadata.

4. **Full-Stack Persistence & Security**:
   - Real Gemini visual editing using `@google/genai` server-side SDK.
   - Supabase PostgreSQL database with `render_jobs` table and Row Level Security (RLS).
   - Supabase Storage private buckets (`original_images` and `rendered_images`).
   - Authentication (Login, Register, Logout) with protected user galleries.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- Google AI Studio API key (`GEMINI_API_KEY`)
- (Optional) Supabase project credentials for persistent storage and auth

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Required: Gemini API Key
GEMINI_API_KEY="your-google-ai-studio-api-key"

# Image editing model (default: gemini-3.1-flash-lite-image or gemini-nano-banana-2.1)
GEMINI_IMAGE_MODEL="gemini-3.1-flash-lite-image"

# Optional: Supabase configuration (for cloud storage and user accounts)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

PORT=3000
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup & Database Migration

1. Open your Supabase Project SQL Editor.
2. Run the migration script located at `supabase/migrations/20261028_archviz_init.sql`.
3. The script will:
   - Create the `render_jobs` table.
   - Create the private storage buckets `original_images` and `rendered_images`.
   - Enable Row Level Security (RLS) so users can only view and manage their own files.

---

## 🚢 Deployment

### Deploying to Vercel via GitHub
1. Push this repository to GitHub.
2. In the Vercel Dashboard, import the repository.
3. In Project Settings > Environment Variables, add:
   - `GEMINI_API_KEY`
   - `GEMINI_IMAGE_MODEL` (e.g. `gemini-3.1-flash-lite-image`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy! The application builds with `npm run build` and runs on Vercel's global edge infrastructure.
