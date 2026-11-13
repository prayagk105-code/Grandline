-- =============================================================================
-- Grandline - PostgreSQL Database Schema
-- Compatible with Supabase and Standard PostgreSQL 14+
-- Generated for Grandline Monorepo
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "DisplayName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(256) NOT NULL,
    "NormalizedEmail" VARCHAR(256) NOT NULL,
    "PasswordHash" VARCHAR(512) NOT NULL,
    "ThemePreference" VARCHAR(20) NOT NULL DEFAULT 'auto',
    "JourneyStartDate" DATE NOT NULL,
    "TimeZoneId" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsDemoUser" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_users_NormalizedEmail" ON users ("NormalizedEmail");

-- -----------------------------------------------------------------------------
-- 2. Refresh Tokens & Password Resets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "TokenHash" VARCHAR(128) NOT NULL,
    "ExpiresAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RevokedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "ReplacedByTokenHash" VARCHAR(128) NULL,
    "UserAgent" VARCHAR(300) NULL
);

CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_UserId" ON refresh_tokens ("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_refresh_tokens_TokenHash" ON refresh_tokens ("TokenHash");

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "TokenHash" VARCHAR(128) NOT NULL,
    "ExpiresAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UsedAtUtc" TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_UserId" ON password_reset_tokens ("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_password_reset_tokens_TokenHash" ON password_reset_tokens ("TokenHash");

-- -----------------------------------------------------------------------------
-- 3. Email OTP Verifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_otps (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Email" VARCHAR(256) NOT NULL,
    "OtpHash" VARCHAR(128) NOT NULL,
    "ExpiresAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UsedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "Attempts" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_email_otps_Email" ON email_otps ("Email");
CREATE INDEX IF NOT EXISTS "IX_email_otps_ExpiresAtUtc" ON email_otps ("ExpiresAtUtc");

-- -----------------------------------------------------------------------------
-- 4. Habits Module
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Name" VARCHAR(120) NOT NULL,
    "Category" VARCHAR(50) NOT NULL,
    "Target" VARCHAR(160) NULL,
    "Icon" VARCHAR(40) NOT NULL,
    "Color" VARCHAR(32) NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_habits_UserId_IsActive" ON habits ("UserId", "IsActive");

CREATE TABLE IF NOT EXISTS habit_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "HabitId" UUID NOT NULL REFERENCES habits("Id") ON DELETE CASCADE,
    "LogDate" DATE NOT NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_habit_logs_HabitId" ON habit_logs ("HabitId");
CREATE INDEX IF NOT EXISTS "IX_habit_logs_UserId_LogDate" ON habit_logs ("UserId", "LogDate");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_habit_logs_UserId_HabitId_LogDate" ON habit_logs ("UserId", "HabitId", "LogDate");

-- -----------------------------------------------------------------------------
-- 5. Study & Learning Paths Module
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_paths (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Name" VARCHAR(140) NOT NULL,
    "Description" VARCHAR(500) NULL,
    "Icon" VARCHAR(40) NOT NULL,
    "TargetMinutes" INTEGER NULL,
    "Progress" INTEGER NOT NULL DEFAULT 0,
    "IsArchived" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_learning_paths_UserId_IsArchived" ON learning_paths ("UserId", "IsArchived");

CREATE TABLE IF NOT EXISTS study_sessions (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "LearningPathId" UUID NULL REFERENCES learning_paths("Id") ON DELETE SET NULL,
    "Topic" VARCHAR(160) NOT NULL,
    "Minutes" INTEGER NOT NULL,
    "SessionDate" DATE NOT NULL,
    "Notes" VARCHAR(1000) NULL,
    "StartedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "CompletedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "ClientSessionKey" VARCHAR(100) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_study_sessions_LearningPathId" ON study_sessions ("LearningPathId");
CREATE INDEX IF NOT EXISTS "IX_study_sessions_UserId_LearningPathId" ON study_sessions ("UserId", "LearningPathId");
CREATE INDEX IF NOT EXISTS "IX_study_sessions_UserId_SessionDate" ON study_sessions ("UserId", "SessionDate");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_study_sessions_UserId_ClientSessionKey" ON study_sessions ("UserId", "ClientSessionKey") WHERE "ClientSessionKey" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Memories & Media Assets Module
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memories (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(160) NOT NULL,
    "MemoryDate" DATE NOT NULL,
    "Category" VARCHAR(32) NOT NULL,
    "Note" VARCHAR(2000) NULL,
    "Icon" VARCHAR(40) NULL,
    "GradientIndex" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_memories_UserId_Category" ON memories ("UserId", "Category");
CREATE INDEX IF NOT EXISTS "IX_memories_UserId_MemoryDate" ON memories ("UserId", "MemoryDate");

CREATE TABLE IF NOT EXISTS media_assets (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "MemoryId" UUID NULL REFERENCES memories("Id") ON DELETE SET NULL,
    "Provider" VARCHAR(40) NOT NULL,
    "PublicId" VARCHAR(255) NOT NULL,
    "SecureUrl" VARCHAR(500) NOT NULL,
    "ResourceType" VARCHAR(40) NOT NULL,
    "Format" VARCHAR(20) NOT NULL,
    "Bytes" BIGINT NOT NULL,
    "Width" INTEGER NULL,
    "Height" INTEGER NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_media_assets_UserId" ON media_assets ("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_media_assets_MemoryId" ON media_assets ("MemoryId");

-- -----------------------------------------------------------------------------
-- 7. Journal Module
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "EntryDate" DATE NOT NULL,
    "Accomplishments" VARCHAR(4000) NULL,
    "Distractions" VARCHAR(4000) NULL,
    "Improvements" VARCHAR(4000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_journal_entries_UserId_EntryDate" ON journal_entries ("UserId", "EntryDate");

-- -----------------------------------------------------------------------------
-- 8. Planner & Reminders Module
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "ReminderDate" DATE NOT NULL,
    "ReminderTime" TIME WITHOUT TIME ZONE NULL,
    "RepeatFrequency" VARCHAR(20) NOT NULL DEFAULT 'Never',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_reminders_UserId_ReminderDate_IsActive" ON reminders ("UserId", "ReminderDate", "IsActive");

-- -----------------------------------------------------------------------------
-- 9. Seed Default User (Prayag)
-- -----------------------------------------------------------------------------
INSERT INTO users (
    "Id",
    "DisplayName",
    "Email",
    "NormalizedEmail",
    "PasswordHash",
    "ThemePreference",
    "JourneyStartDate",
    "TimeZoneId",
    "IsActive",
    "IsDemoUser"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Prayag',
    'Prayagk@gmail.com',
    'PRAYAGK@GMAIL.COM',
    'Prayagk@123',
    'auto',
    CURRENT_DATE,
    'UTC',
    TRUE,
    FALSE
) ON CONFLICT ("NormalizedEmail") DO NOTHING;

