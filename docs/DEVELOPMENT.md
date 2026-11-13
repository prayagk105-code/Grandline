# DAYFORM Development, Seeding & Testing Guide

## 1. Environment & Secrets Setup

### Backend (`backend/.env.example`)
In local development, prefer ASP.NET Core User Secrets over plaintext `.env` files so secrets stay outside the workspace:

```powershell
cd backend/src/Dayform.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<supabase-postgres-connection-string>"
dotnet user-secrets set "Jwt:SigningKey" "<random-32+-character-secret>"
dotnet user-secrets set "Cloudinary:CloudName" "<cloudinary-cloud-name>"
dotnet user-secrets set "Cloudinary:ApiKey" "<cloudinary-api-key>"
dotnet user-secrets set "Cloudinary:ApiSecret" "<cloudinary-api-secret>"
```

`Jwt:SigningKey` has a local development fallback key in `Development` / `Testing` only; **non-development environments throw on startup if `Jwt:SigningKey` is missing or shorter than 32 characters**.

### Frontend (`frontend/.env.example`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_ENABLE_DEMO_LOGIN=true
```

Set `VITE_ENABLE_DEMO_LOGIN=false` for production builds.

## 2. Development Demo Data Seed (`DemoSeedService`)

`DemoSeedService` creates a deterministic (`new Random(7)`), idempotent ~5-month (150-day) history ending on the execution date for `alex@example.com` (`IsDemoUser = true`), including:
- 7 habits across `Health`, `Learning`, `Mind`, and `Lifestyle` with realistic 150-day completion history
- 3 learning paths and ~45 study sessions
- 7 memories across `Everyday`, `Travel`, and `Milestone` (text/gradient cards without fabricated Cloudinary URLs)
- Past journal reflection entries
- Upcoming and recurring reminders

### Explicit CLI Commands (Development Environment Only)
```powershell
# Apply migrations and ensure demo data exists (idempotent; skips if already seeded)
dotnet run --project backend/src/Dayform.Api -- --seed

# Delete and deterministically regenerate the demo user's 150-day dataset
dotnet run --project backend/src/Dayform.Api -- --reset-demo

# Remove the demo user and all demo records cleanly
dotnet run --project backend/src/Dayform.Api -- --remove-demo
```

Running any of these flags outside `ASPNETCORE_ENVIRONMENT=Development` is blocked and throws an `InvalidOperationException`.

## 3. Running Locally

Terminal 1 (Backend):
```powershell
dotnet run --project backend/src/Dayform.Api
```

Terminal 2 (Frontend):
```powershell
npm run dev --prefix frontend
```

## 4. Testing Commands

### Backend Unit & Integration Tests
```powershell
dotnet test backend
```
- `Dayform.UnitTests`: tests habit streaks, weekly/range completion percentages, recurring reminder projections (`Daily`, `Weekly`, `Monthly`, `Yearly`), password/email validation rules, and memory image validation guards.
- `Dayform.IntegrationTests`: uses `WebApplicationFactory<Program>` with EF Core InMemory database and `FakeImageStorageService` (avoiding live Cloudinary calls) to test auth lifecycle, cross-user isolation, idempotent study session logging, image upload/delete cleanup, dashboard/progress projections, and JSON export.

> **Note on Windows Application Control (WDAC)**: On Windows hosts with strict Application Control / Smart App Control policies enforced, executing unsigned compiled `.NET` assemblies (`dotnet test`, `dotnet ef`, `dotnet run`) may fail with `System.IO.FileLoadException ... (0x800711C7)` until the binaries are signed or allowed by your workstation policy / CI Linux container.

### Frontend Build, Lint & Unit Tests
```powershell
npm run build --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
```

### Playwright End-to-End Tests
Install Playwright browsers once, start the backend (`Development`) and frontend (`npm run dev`), then execute:
```powershell
npx --prefix frontend playwright install chromium
npm run test:e2e --prefix frontend
```
Set `E2E_BASE_URL` (default `http://localhost:5173`) and `E2E_API_BASE_URL` (default `http://localhost:5000/api/v1`) as needed.

