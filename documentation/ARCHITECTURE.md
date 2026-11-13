# Grandline - System Architecture

Grandline is an all-in-one personal performance, habit formation, study tracking, memory preservation, and life reflection ecosystem structured as a clean, modular monorepo.

## 1. Monorepo Organization

Grandline organizes the full-stack system under a single unified Git repository while maintaining strict architectural boundaries:

```text
Grandline/
│
├── frontend/             # Single-Page Application (React 18 + TypeScript + Vite)
│   ├── src/
│   │   ├── app/          # Core router, routes, global state orchestration
│   │   ├── components/   # Modular feature components (habits, study, memories, planner, layout, common)
│   │   ├── contexts/     # AuthContext, ToastContext, FocusTimerContext
│   │   ├── layouts/      # AppLayout (responsive sidebar & mobile nav) & AuthLayout
│   │   ├── pages/        # Feature views (Home/Balance, Habits, Study, Memories, Progress, Planner, Journal, Profile, Auth)
│   │   ├── services/     # Axios client & typed API service contracts
│   │   ├── styles/       # Warm cream & forest-green palette design tokens
│   │   └── types/        # TypeScript domain models and API contracts
│   ├── e2e/              # Playwright browser integration tests
│   └── tests/            # Vitest unit & component test suite
│
├── backend/              # Clean Architecture Backend (ASP.NET Core 10 / .NET 10)
│   ├── src/
│   │   ├── Dayform.Domain/         # Core entities, value objects, domain enums, auditable base
│   │   ├── Dayform.Application/    # DTOs, FluentValidation rules, business algorithms, service interfaces
│   │   ├── Dayform.Infrastructure/ # EF Core PostgreSQL DbContext, migrations, JWT auth, Cloudinary storage, Node mailer
│   │   └── Dayform.Api/            # REST Controllers (/api/v1/*), rate limiting, middleware, Swagger
│   ├── mailer/                     # Node.js + Nodemailer OTP delivery worker
│   └── tests/                      # xUnit test suites (UnitTests & IntegrationTests)
│
├── database/             # PostgreSQL DDL schemas, migration guides, and indexing documentation
├── storage/              # Cloudinary media storage architecture and upload specifications
├── documentation/        # Architectural guides, API specifications, and database documentation
├── tests/                # Unified testing strategy and matrix
├── .gitignore            # Git exclusion rules protecting credentials and build artifacts
├── README.md             # Project overview, installation, and startup guide
└── LICENSE               # MIT License
```

## 2. Modules & Feature Capabilities

Grandline features are structured into cohesive modules:

1. **Balance (Dashboard)**:
   - Aggregates daily health, habit completion percentages, active study progress, upcoming reminders, and recent journal sentiment into a single executive view.
2. **Habits**:
   - Habit management, daily logging, custom icon/color categorization, streaks, best streak computation, and 21-week activity heatmaps.
3. **Study & Focus Timer**:
   - Curriculum learning paths with target completion tracking, idempotent session logging (`ClientSessionKey`), and persistent timestamp-based Pomodoro/focus timer (25/50/60 min presets).
4. **Memories**:
   - Chronological life events and milestones timeline, category filtering (Everyday, Travel, Milestone), and server-side Cloudinary photo upload with magic-byte validation.
5. **Progress**:
   - Comprehensive analytics across Week, Month, and 5-Month spans with period-over-period comparisons and 180-day journey milestones.
6. **Planner**:
   - Visual calendar grid, daily agenda, recurring reminder engine (`Never`, `Daily`, `Weekly`, `Monthly`, `Yearly`) with non-duplicating dynamic projections.
7. **Journal**:
   - Guided daily reflection framework (Accomplishments, Distractions, Improvements) and historical entry browsing.
8. **Profile & Security**:
   - Account settings, theme customization (`Auto`, `Light`, `Dark`) persisted in PostgreSQL, JSON data archive export, and secure logout.
9. **Authentication**:
   - Password-based registration and login, password strength validation, 6-digit email OTP verification, JWT access tokens in memory, and HttpOnly refresh token cookie rotation.

## 3. Security Architecture

- **Token Rotation**: Short-lived JWT access tokens (15 minutes) held in memory; long-lived refresh tokens (14 days) stored as cryptographically hashed HttpOnly cookies with automatic rotation.
- **Tenant Isolation**: Every database interaction filters strictly by `UserId` resolved from the cryptographically verified JWT claims.
- **Rate Limiting**: Auth endpoints utilize IP and identity rate limiting to prevent brute force attacks.
- **Input Validation**: Backend FluentValidation validates all incoming DTOs; frontend Zod / HTML5 schemas provide immediate feedback.
- **Zero Secrets in Source**: All API keys, connection strings, and credentials are provided via environment variables or secret managers and excluded from Git.

