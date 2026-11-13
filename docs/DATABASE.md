# DAYFORM Database Schema & Supabase PostgreSQL Guide

DAYFORM uses **PostgreSQL** via **Entity Framework Core 10** (`Npgsql.EntityFrameworkCore.PostgreSQL`). All tables are normalized, indexed by `(UserId, ...)` for tenant isolation and query performance, and managed by EF Core migrations in [`backend/src/Dayform.Infrastructure/Migrations`](../backend/src/Dayform.Infrastructure/Migrations).

## Schema Tables

| Table | Entity | Primary Key & Key Columns | Constraints & Indexes |
|---|---|---|---|
| `users` | `User` | `Id` (uuid), `DisplayName`, `Email`, `NormalizedEmail`, `PasswordHash`, `ThemePreference` (string), `JourneyStartDate` (date), `TimeZoneId`, `IsActive`, `IsDemoUser` | Unique index on `NormalizedEmail`. |
| `refresh_tokens` | `RefreshToken` | `Id` (uuid), `UserId` (FK), `TokenHash` (SHA-256), `ExpiresAtUtc`, `RevokedAtUtc`, `ReplacedByTokenHash`, `UserAgent` | Unique index on `TokenHash`; index on `UserId`; cascade delete from `users`. |
| `password_reset_tokens` | `PasswordResetToken` | `Id` (uuid), `UserId` (FK), `TokenHash`, `ExpiresAtUtc`, `UsedAtUtc` | Unique index on `TokenHash`; index on `UserId`; cascade delete. |
| `habits` | `Habit` | `Id` (uuid), `UserId` (FK), `Name`, `Category`, `Target`, `Icon`, `Color`, `IsActive`, `SortOrder` | Index on `(UserId, IsActive)`; cascade delete. |
| `habit_logs` | `HabitLog` | `Id` (uuid), `UserId` (FK), `HabitId` (FK), `LogDate` (date), `IsCompleted` | Unique index on `(UserId, HabitId, LogDate)`; index on `(UserId, LogDate)`; cascade delete from both `users` and `habits`. |
| `learning_paths` | `LearningPath` | `Id` (uuid), `UserId` (FK), `Name`, `Description`, `Icon`, `TargetMinutes`, `Progress`, `IsArchived` | Index on `(UserId, IsArchived)`; cascade delete. |
| `study_sessions` | `StudySession` | `Id` (uuid), `UserId` (FK), `LearningPathId` (nullable FK), `Topic`, `Minutes`, `SessionDate` (date), `Notes`, `StartedAtUtc`, `CompletedAtUtc`, `ClientSessionKey` | Filtered unique index on `(UserId, ClientSessionKey)` where `ClientSessionKey IS NOT NULL`; indexes on `(UserId, SessionDate)` and `(UserId, LearningPathId)`; `LearningPathId` uses `ON DELETE SET NULL`. |
| `memories` | `Memory` | `Id` (uuid), `UserId` (FK), `Title`, `MemoryDate` (date), `Category` (`Everyday\|Travel\|Milestone`), `Note`, `Icon`, `GradientIndex` | Indexes on `(UserId, MemoryDate)` and `(UserId, Category)`; cascade delete. |
| `media_assets` | `MediaAsset` | `Id` (uuid), `UserId` (FK), `MemoryId` (nullable FK), `Provider`, `PublicId`, `SecureUrl`, `ResourceType`, `Format`, `Bytes`, `Width`, `Height` | Unique index on `MemoryId`; index on `UserId`; `MemoryId` uses `ON DELETE SET NULL` (controller/service handles Cloudinary cleanup on delete/replace). |
| `journal_entries` | `JournalEntry` | `Id` (uuid), `UserId` (FK), `EntryDate` (date), `Accomplishments`, `Distractions`, `Improvements` | Unique index on `(UserId, EntryDate)`; cascade delete. |
| `reminders` | `Reminder` | `Id` (uuid), `UserId` (FK), `Title`, `ReminderDate` (date), `ReminderTime` (time), `RepeatFrequency` (`Never\|Daily\|Weekly\|Monthly\|Yearly`), `IsActive` | Index on `(UserId, ReminderDate, IsActive)`; cascade delete. |

## Supabase PostgreSQL Configuration

1. Obtain your Supabase PostgreSQL connection string from **Project Settings -> Database -> Connection string**.
   - **Recommended for local migrations & direct long-lived API server**: Direct connection (`Port=5432`) or Session pooler (`Port=5432`) with `SSL Mode=Require`.
   - **For Transaction pooler (`Port=6543`)**: Disable prepared statement caching in Npgsql if needed, and keep `dotnet ef` migrations pointed at the direct/session endpoint.
2. Example connection string:
   ```text
   Host=db.<your-project-ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-db-password>;SSL Mode=Require;Trust Server Certificate=true
   ```
3. Store the connection string in **ASP.NET Core User Secrets** locally or deployment environment variables (`ConnectionStrings__DefaultConnection`). Never commit it to git or expose it to the React frontend.

### Row Level Security (RLS) Policy Note

- The React frontend **never** calls Supabase tables directly and **never** receives any Supabase key. All traffic passes through `Dayform.Api`.
- Because `Dayform.Api` authenticates with PostgreSQL using a privileged backend role (`postgres` or a dedicated backend service role), **PostgreSQL RLS alone does not replace API-level authorization**.
- Every application query and mutation filters explicitly by the authenticated `ICurrentUserService.UserId` derived from the validated JWT `sub` claim.
- If you enable RLS on public schema tables in Supabase as defense-in-depth (to block direct PostgREST `anon`/`authenticated` browser access), deny all `anon`/`authenticated` PostgREST policies while allowing the backend migration/API database role to operate normally.

## Applying Migrations Safely

```powershell
# Inspect pending migrations
dotnet ef migrations list --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api

# Generate an idempotent SQL script for production review before applying
dotnet ef migrations script --idempotent --output migration.sql --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api

# Apply migrations to configured database
dotnet ef database update --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api
```

