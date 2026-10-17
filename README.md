# FlowBoard — Full Stack Kanban Board

A full-stack Kanban board with **To Do / Doing / Done** columns, task creation, drag-and-drop or arrow-button moves, deletion, and persistent Supabase storage.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Python FastAPI
- Database: Supabase PostgreSQL
- Deployment: Google Cloud Run (backend), Cloudflare Pages (frontend)

## 1. Set up Supabase
1. Create a Supabase project at https://supabase.com/dashboard
2. Open **SQL Editor**, paste and run `schema.sql`.
3. Under Project Settings > API Keys, get your project URL and **service_role** secret key (or the current server-side secret key). **Never place this key in frontend files or public environment variables.**

## 2. Run backend locally
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and supply real credentials.
# Export environment variables (the .env file is not automatically loaded):
set -a; source .env; set +a
uvicorn main:app --reload --port 8000
```
API documentation: http://localhost:8000/docs

## 3. Run frontend locally
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Visit http://localhost:5173

## 4. Deploy backend to Google Cloud Run
Install gcloud CLI, sign in, and select a billing-enabled Google Cloud project. Enable Cloud Run, Cloud Build and Artifact Registry APIs. From `backend/` run:
```bash
gcloud run deploy kanban-api --source . --region asia-southeast1 --allow-unauthenticated --set-env-vars "SUPABASE_URL=https://YOUR_PROJECT.supabase.co" --set-env-vars "SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_SERVICE_ROLE_KEY" --set-env-vars "CORS_ORIGINS=https://YOUR_PROJECT.pages.dev"
```
For production, **prefer Google Secret Manager** over placing the service-role key directly in a shell command. Copy the resulting Cloud Run URL. Check `/health` and `/docs`.

## 5. Deploy frontend to Cloudflare Pages
1. Push this entire project to your own GitHub repository (do not commit `.env` files).
2. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git.
3. Select your repository and set **Root directory** to `frontend`.
4. Framework preset: **Vite**. Build command: `npm run build`. Build output: `dist`.
5. Set the build environment variable `VITE_API_URL` to the Cloud Run backend URL (without trailing slash).
6. Deploy. Copy the resulting `https://...pages.dev` link.
7. Ensure the backend's `CORS_ORIGINS` matches the actual Pages URL. Update and redeploy backend if necessary.

## Submission
1. GitHub Link: `https://github.com/YOUR_USERNAME/YOUR_REPOSITORY`
2. Deployed Link (Frontend): `https://YOUR_PROJECT.pages.dev`

## Quick checks
- Add a task in To Do.
- Move it to Doing and then Done by arrows or drag and drop.
- Refresh: task persists.
- Delete the task: it disappears and stays deleted after refresh.

## Security note
This coursework demo exposes a shared board publicly through an unauthenticated API. Do not use for private or sensitive data. For real users, add authentication, per-user authorization, rate limits, and restrictive CORS. Supabase service role remains backend-only.
