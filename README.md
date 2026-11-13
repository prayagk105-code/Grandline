# Grandline ⚓ — Full-Stack Personal Daily Tracker & Life Operating System

Grandline is an all-in-one personal performance, habit formation, study tracking, memory preservation, and life reflection ecosystem. Built as a high-performance monorepo, Grandline combines a clean-architecture **ASP.NET Core 10 (.NET 10)** backend with a modern **React 18 + TypeScript + Vite** frontend, powered by **Supabase PostgreSQL** and **Cloudinary** media storage.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Main Features & Modules](#main-features--modules)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Monorepo Folder Structure](#monorepo-folder-structure)
- [Installation & Prerequisites](#installation--prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup & Migrations](#database-setup--migrations)
- [Backend Startup Instructions](#backend-startup-instructions)
- [Frontend Startup Instructions](#frontend-startup-instructions)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment Guidelines](#deployment-guidelines)
- [License](#license)

---

## 🌟 Overview

Grandline helps individuals navigate their daily life, habits, learning milestones, and memories with precision. Rather than scattering personal tracking across disparate apps, Grandline connects daily disciplines into a single cohesive platform with strict user isolation, end-to-end security, and an elegant warm-cream and forest-green design language.

---

## ✨ Main Features & Modules

Grandline is organized as an integrated monorepo consisting of the following key modules:

1. **Balance (Dashboard)**:
   - Executive daily dashboard summarizing today's habit completions, focus progress, pending reminders, and recent reflection sentiment.
   - Real-time status cards and quick navigation to all active modules.

2. **Habits Module**:
   - Create, edit, archive, and reorder daily and weekly habits.
   - One-tap daily check-ins with instant streak recalculation.
   - Comprehensive analytics: current streak, best streak, and a 21-week visual activity heatmap.

3. **Study & Focus Timer Module**:
   - Curriculum and learning paths with progress bars and target study hours.
   - Idempotent study session logging protected with unique client session keys (`ClientSessionKey`).
   - Integrated Pomodoro focus timer with persistent timestamp tracking (`25 / 50 / 60` min presets) resilient to page refreshes.

4. **Memories Module**:
   - Chronological life events, journal milestones, and photo memories timeline.
   - Categorized browsing: `Everyday`, `Travel`, and `Milestone`.
   - Secure server-side media processing via Cloudinary with magic-byte and MIME validation (5 MB limit).

5. **Progress & Analytics Module**:
   - Multi-timespan performance reviews (`Week`, `Month`, `~5 months`).
   - Period-over-period comparisons, completion velocity charts, and 180-day journey milestones.

6. **Planner & Reminders Module**:
   - Full month-grid interactive calendar and daily agenda planner.
   - Recurring reminders engine with non-duplicating dynamic projections (`Never`, `Daily`, `Weekly`, `Monthly`, `Yearly`).

7. **Journal Module**:
   - Structured 3-prompt daily reflection framework: *What did you accomplish?*, *What distracted you?*, *How will you improve tomorrow?*.
   - Historical reflection archive searchable by date.

8. **Profile & Account Preferences**:
   - Profile management, theme customization (`Auto`, `Light`, `Dark`) persisted directly in PostgreSQL.
   - Full GDPR-friendly JSON account data export.

9. **Authentication & Security**:
   - User registration and login with Argon2/Identity password hashing.
   - 6-digit email OTP verification via dedicated Node.js mailer worker.
   - Short-lived JWT access tokens stored securely in memory with automatic rotation of HttpOnly refresh cookies (`dayform_refresh_token`).
   - Strict tenant isolation enforced on every query and mutation via `UserId`.

---

## 🛠 Technology Stack

### Backend
- **Framework**: ASP.NET Core 10 (.NET 10 C#)
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Api)
- **Database ORM**: Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Authentication**: JWT Bearer Tokens + HttpOnly Refresh Cookies + ASP.NET Core Identity
- **Validation**: FluentValidation
- **Media Storage**: Cloudinary .NET SDK (Server-Side Uploads)
- **Mailing**: Node.js microservice (`nodemailer`) for transactional OTPs
- **API Documentation**: OpenAPI / Swagger UI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router v6
- **State Management**: React Contexts (`AuthContext`, `ToastContext`, `FocusTimerContext`)
- **HTTP Client**: Axios with automated token refresh interceptors
- **Styling**: Modular CSS tokens (Warm cream, forest-green, burnt orange)
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, Playwright

### Database & Infrastructure
- **Database**: PostgreSQL 14+ (hosted on Supabase or self-hosted)
- **Media CDN**: Cloudinary
- **Version Control**: Git / GitHub Monorepo

---

## 🏛 Project Architecture

Grandline adheres strictly to Clean Architecture separation of concerns:

```text
[ React 18 Frontend SPA ] ──(HTTPS / REST / JWT)──► [ Dayform.Api (Controllers & Middleware) ]
                                                              │
                                                     [ Dayform.Application ]
                                                     (DTOs, Use Cases, Validators)
                                                              │
                                                     [ Dayform.Domain ]
                                                     (Entities, Value Objects, Enums)
                                                              ▲
                                                              │
                                                  [ Dayform.Infrastructure ]
                                          (EF Core DbContext, PostgreSQL, Cloudinary, Mailer)
```

---

## 📁 Monorepo Folder Structure

```text
Grandline/
│
├── frontend/                     # React 18 + TypeScript Vite application
│   ├── e2e/                      # Playwright end-to-end tests
│   ├── src/
│   │   ├── app/                  # Application router and root entry
│   │   ├── components/           # Feature components
│   │   │   ├── common/           # Buttons, modals, form controls, spinners
│   │   │   ├── habits/           # Habit cards, heatmaps, check-in dialogs
│   │   │   ├── layout/           # AppLayout, Sidebar, MobileNav
│   │   │   ├── memories/         # Timeline, photo cards, upload modal
│   │   │   ├── planner/          # Calendar view, reminder dialogs
│   │   │   └── study/            # Study timer, learning path progress
│   │   ├── contexts/             # Global React state (Auth, Toast, FocusTimer)
│   │   ├── layouts/              # AppLayout (Desktop sidebar & Mobile tabs) & AuthLayout
│   │   ├── pages/                # Page views (Home, Habits, Study, Memories, etc.)
│   │   │   └── auth/             # Login, Register, VerifyOtp, ForgotPassword
│   │   ├── services/             # Axios instance & typed API service modules
│   │   ├── styles/               # Design system variables and global styles
│   │   ├── test/                 # Vitest component test suites
│   │   └── types/                # Shared TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # ASP.NET Core 10 Web API Solution
│   ├── Dayform.slnx              # Solution file
│   ├── mailer/                   # Transactional OTP mailer microservice (Node.js)
│   ├── src/
│   │   ├── Dayform.Domain/       # Domain entities, value objects, and enums
│   │   ├── Dayform.Application/  # Service contracts, DTOs, FluentValidation rules
│   │   ├── Dayform.Infrastructure/# EF Core, PostgreSQL DbContext, Cloudinary, JWT
│   │   └── Dayform.Api/          # REST Controllers (/api/v1/*), Swagger, Filters
│   └── tests/
│       ├── Dayform.UnitTests/    # Unit tests for domain calculators and validators
│       └── Dayform.IntegrationTests/ # WebApplicationFactory integration test suite
│
├── database/                     # PostgreSQL schema scripts, migration notes, and ERD
│   ├── schema.sql                # Standalone SQL schema definition
│   └── README.md                 # Database setup and indexing documentation
│
├── storage/                      # Cloudinary media storage documentation & guidelines
│   └── README.md
│
├── documentation/                # Centralized project documentation
│   ├── ARCHITECTURE.md           # Deep dive into system architecture & security
│   ├── API.md                    # REST API endpoint contracts and specifications
│   ├── DATABASE.md               # Supabase PostgreSQL schema and migration guide
│   ├── DEVELOPMENT.md            # Local development, debugging, and testing guide
│   └── README.md                 # Documentation index
│
├── tests/                        # Unified testing strategy and matrix
│   └── README.md
│
├── .gitignore                    # Comprehensive Git exclusion rules
├── LICENSE                       # MIT License
└── README.md                     # Root project documentation
```

---

## ⚡ Installation & Prerequisites

Ensure the following tools are installed:

- **[.NET 10 SDK](https://dotnet.microsoft.com/)** (`net10.0`)
- **[Node.js 20+](https://nodejs.org/)** and `npm`
- **[PostgreSQL 14+](https://www.postgresql.org/)** or a free [Supabase](https://supabase.com/) project
- **[Cloudinary](https://cloudinary.com/)** account (for image upload storage)
- **[Git](https://git-scm.com/)**

---

## 🔐 Environment Configuration

### 1. Backend Configuration

Create a `.env` file in `backend/` or configure ASP.NET Core User Secrets:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env
```

Set the required environment keys in `backend/.env` or user secrets:

```env
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000

# PostgreSQL Connection String (Supabase or Local)
ConnectionStrings__DefaultConnection=Host=db.<your-project-ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-db-password>;SSL Mode=Require;Trust Server Certificate=true

# JWT Signing Key (Must be at least 32 characters)
Jwt__SigningKey=YOUR_CRYPTOGRAPHICALLY_SECURE_32_CHAR_KEY_HERE
Jwt__Issuer=Dayform.Api
Jwt__Audience=Dayform.Client
Jwt__AccessTokenMinutes=15
Jwt__RefreshTokenDays=14

# Cloudinary Credentials (Server-side media upload)
Cloudinary__CloudName=<your-cloudinary-cloud-name>
Cloudinary__ApiKey=<your-cloudinary-api-key>
Cloudinary__ApiSecret=<your-cloudinary-api-secret>

# CORS Origin
Frontend__AllowedOrigins=http://localhost:5173

# Optional Demo Seeder (Only active in Development)
Demo__Enabled=true
Demo__SeedOnStartup=true
Demo__Email=alex@example.com
Demo__Password=DayformDemo123!
```

### 2. Frontend Configuration

Create a `.env` file in `frontend/`:

```bash
cp frontend/.env.example frontend/.env
```

Ensure the API base URL matches your backend instance:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_ENABLE_DEMO_LOGIN=true
```

---

## 🗄 Database Setup & Migrations

### Apply EF Core Migrations

```powershell
# Navigate to project root and run EF update
dotnet ef database update --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api
```

### Direct SQL Schema Execution

Alternatively, execute `database/schema.sql` directly inside the Supabase SQL Editor or your PostgreSQL database terminal.

---

## 🚀 Backend Startup Instructions

### 1. Install Mailer Dependencies (for OTPs)

```powershell
cd backend/mailer
npm install
cd ../..
```

### 2. Run the Backend API

```powershell
dotnet run --project backend/src/Dayform.Api
```

- **API Base URL**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/swagger`

---

## 💻 Frontend Startup Instructions

```powershell
cd frontend
npm install
npm run dev
```

- **Application URL**: `http://localhost:5173`

---

## 🧪 Testing & Quality Assurance

### Run Frontend Component Tests (Vitest)
```powershell
cd frontend
npm run test
```

### Run End-to-End Tests (Playwright)
```powershell
cd frontend
npx playwright test
```

### Run Backend Tests (.NET)
```powershell
dotnet test backend/tests/Dayform.UnitTests/Dayform.UnitTests.csproj
dotnet test backend/tests/Dayform.IntegrationTests/Dayform.IntegrationTests.csproj
```

---

## 🚢 Deployment Guidelines

- **Backend**: Can be containerized via Docker and deployed to Azure App Service, AWS ECS, Railway, or Render.
- **Frontend**: Built with `npm run build` producing static assets in `frontend/dist/`, ready for hosting on Cloudflare Pages, Vercel, Netlify, or AWS S3 + CloudFront.
- **Database**: Production PostgreSQL database managed through Supabase or Amazon RDS.
- **Security Reminder**: Never commit `.env`, `appsettings.Development.json`, or secret tokens to source control.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
