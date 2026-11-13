# Grandline Database

This directory contains the database documentation, migration references, and initialization SQL schema for the Grandline application.

## Overview

Grandline utilizes **PostgreSQL** (hosted via Supabase or self-hosted PostgreSQL) managed through **Entity Framework Core 10** (`Npgsql.EntityFrameworkCore.PostgreSQL`).

All tables are fully normalized, enforced with strict primary and foreign key constraints, and indexed with tenant isolation composite indexes `(UserId, ...)` to ensure tenant data isolation and low query latency.

## Schema Architecture

| Table | Entity | Key Attributes | Indexes & Isolation |
|---|---|---|---|
| `users` | `User` | `Id` (UUID), `DisplayName`, `Email`, `NormalizedEmail`, `PasswordHash`, `ThemePreference`, `JourneyStartDate`, `TimeZoneId`, `IsActive`, `IsDemoUser` | Unique index on `NormalizedEmail` |
| `refresh_tokens` | `RefreshToken` | `Id` (UUID), `UserId` (FK), `TokenHash` (SHA-256), `ExpiresAtUtc`, `RevokedAtUtc`, `ReplacedByTokenHash`, `UserAgent` | Unique on `TokenHash`, indexed on `UserId` |
| `password_reset_tokens` | `PasswordResetToken` | `Id` (UUID), `UserId` (FK), `TokenHash`, `ExpiresAtUtc`, `UsedAtUtc` | Unique on `TokenHash`, indexed on `UserId` |
| `email_otps` | `EmailOtp` | `Id` (UUID), `Email`, `OtpHash`, `ExpiresAtUtc`, `UsedAtUtc`, `Attempts` | Indexed on `Email`, `ExpiresAtUtc` |
| `habits` | `Habit` | `Id` (UUID), `UserId` (FK), `Name`, `Category`, `Target`, `Icon`, `Color`, `IsActive`, `SortOrder` | Composite index on `(UserId, IsActive)` |
| `habit_logs` | `HabitLog` | `Id` (UUID), `UserId` (FK), `HabitId` (FK), `LogDate` (DATE), `IsCompleted` | Unique composite index on `(UserId, HabitId, LogDate)`, index on `(UserId, LogDate)` |
| `learning_paths` | `LearningPath` | `Id` (UUID), `UserId` (FK), `Name`, `Description`, `Icon`, `TargetMinutes`, `Progress`, `IsArchived` | Composite index on `(UserId, IsArchived)` |
| `study_sessions` | `StudySession` | `Id` (UUID), `UserId` (FK), `LearningPathId` (Nullable FK), `Topic`, `Minutes`, `SessionDate` (DATE), `Notes`, `StartedAtUtc`, `CompletedAtUtc`, `ClientSessionKey` | Filtered unique index on `(UserId, ClientSessionKey)`, index on `(UserId, SessionDate)` |
| `memories` | `Memory` | `Id` (UUID), `UserId` (FK), `Title`, `MemoryDate` (DATE), `Category`, `Note`, `Icon`, `GradientIndex` | Indexes on `(UserId, MemoryDate)` and `(UserId, Category)` |
| `media_assets` | `MediaAsset` | `Id` (UUID), `UserId` (FK), `MemoryId` (Nullable FK), `Provider`, `PublicId`, `SecureUrl`, `ResourceType`, `Format`, `Bytes`, `Width`, `Height` | Unique index on `MemoryId`, index on `UserId` |
| `journal_entries` | `JournalEntry` | `Id` (UUID), `UserId` (FK), `EntryDate` (DATE), `Accomplishments`, `Distractions`, `Improvements` | Unique composite index on `(UserId, EntryDate)` |
| `reminders` | `Reminder` | `Id` (UUID), `UserId` (FK), `Title`, `ReminderDate` (DATE), `ReminderTime` (TIME), `RepeatFrequency`, `IsActive` | Composite index on `(UserId, ReminderDate, IsActive)` |

## EF Core Migrations

The migrations reside in `backend/src/Dayform.Infrastructure/Migrations/`.

To apply migrations to your database:

```bash
dotnet ef database update --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api
```

To generate idempotent SQL scripts for deployment:

```bash
dotnet ef migrations script --idempotent --output database/schema.sql --project backend/src/Dayform.Infrastructure --startup-project backend/src/Dayform.Api
```

