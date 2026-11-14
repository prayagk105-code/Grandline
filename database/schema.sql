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
    '00000000-0000-0000-0000-000000000002',
    'Grandline Member',
    'user@grandline.com',
    'USER@GRANDLINE.COM',
    'Password@123',
    'auto',
    CURRENT_DATE,
    'UTC',
    TRUE,
    FALSE
) ON CONFLICT ("NormalizedEmail") DO NOTHING;

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
    '00000000-0000-0000-0000-000000000003',
    'Tracker User',
    'tracker@grandline.com',
    'TRACKER@GRANDLINE.COM',
    'Tracker@123',
    'auto',
    CURRENT_DATE,
    'UTC',
    TRUE,
    FALSE
) ON CONFLICT ("NormalizedEmail") DO NOTHING;



-- =============================================================================
-- GRANDLINE COMPLETE FEATURE EXPANSION SCHEMA
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS "AppPinHash" VARCHAR(256) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "DashboardConfigJson" VARCHAR(4000) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "DailyFocusTargetMinutes" INTEGER NOT NULL DEFAULT 120;

-- 1. Goals & Vision
CREATE TABLE IF NOT EXISTS goals (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "Category" VARCHAR(50) NOT NULL,
    "Timeframe" VARCHAR(50) NOT NULL,
    "StartDate" DATE NOT NULL,
    "TargetDate" DATE NOT NULL,
    "ProgressPercentage" INTEGER NOT NULL DEFAULT 0,
    "Status" VARCHAR(30) NOT NULL DEFAULT 'Active',
    "ConnectedHabitId" UUID NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_goals_UserId_Status" ON goals ("UserId", "Status");

CREATE TABLE IF NOT EXISTS goal_milestones (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GoalId" UUID NOT NULL REFERENCES goals("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "TargetDate" DATE NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_action_steps (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GoalId" UUID NOT NULL REFERENCES goals("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vision_board_items (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(150) NOT NULL,
    "ImageUrl" VARCHAR(500) NULL,
    "Quote" VARCHAR(500) NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'General',
    "TargetYear" INTEGER NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Task Management
CREATE TABLE IF NOT EXISTS todo_tasks (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(250) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "Priority" VARCHAR(20) NOT NULL DEFAULT 'Medium',
    "DueDate" DATE NULL,
    "DueTime" TIME NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "IsPinnedToDashboard" BOOLEAN NOT NULL DEFAULT FALSE,
    "Recurrence" VARCHAR(30) NOT NULL DEFAULT 'None',
    "GoalId" UUID NULL,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_todo_tasks_UserId_DueDate" ON todo_tasks ("UserId", "DueDate", "IsCompleted");
CREATE INDEX IF NOT EXISTS "IX_todo_tasks_UserId_Pinned" ON todo_tasks ("UserId", "IsPinnedToDashboard");

CREATE TABLE IF NOT EXISTS task_subtasks (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "TaskId" UUID NOT NULL REFERENCES todo_tasks("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Personal Development
CREATE TABLE IF NOT EXISTS daily_mood_energy_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "LogDate" DATE NOT NULL,
    "MoodScore" INTEGER NOT NULL DEFAULT 3,
    "EnergyScore" INTEGER NOT NULL DEFAULT 3,
    "StressScore" INTEGER NOT NULL DEFAULT 3,
    "Gratitude" VARCHAR(2000) NULL,
    "Reflection" VARCHAR(4000) NULL,
    "LessonsLearned" VARCHAR(2000) NULL,
    "Notes" VARCHAR(2000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_daily_mood_energy_logs_User_Date" ON daily_mood_energy_logs ("UserId", "LogDate");

CREATE TABLE IF NOT EXISTS bad_habits (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Name" VARCHAR(150) NOT NULL,
    "Trigger" VARCHAR(250) NULL,
    "ReplacementHabit" VARCHAR(250) NULL,
    "CleanDaysStartDate" DATE NOT NULL,
    "CleanStreakDays" INTEGER NOT NULL DEFAULT 0,
    "RelapseCount" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_strengths_weaknesses (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Type" VARCHAR(30) NOT NULL,
    "Title" VARCHAR(150) NOT NULL,
    "Description" VARCHAR(1000) NULL,
    "ActionPlan" VARCHAR(1000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Focus & Productivity
CREATE TABLE IF NOT EXISTS focus_sessions (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "SessionDate" DATE NOT NULL,
    "SessionType" VARCHAR(40) NOT NULL DEFAULT 'Pomodoro',
    "DurationMinutes" INTEGER NOT NULL,
    "DistractionCount" INTEGER NOT NULL DEFAULT 0,
    "DistractionNotes" VARCHAR(1000) NULL,
    "Notes" VARCHAR(1000) NULL,
    "CompletedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_focus_sessions_User_Date" ON focus_sessions ("UserId", "SessionDate");

CREATE TABLE IF NOT EXISTS screen_time_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "LogDate" DATE NOT NULL,
    "Category" VARCHAR(50) NOT NULL,
    "DurationMinutes" INTEGER NOT NULL,
    "Notes" VARCHAR(500) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Health & Lifestyle
CREATE TABLE IF NOT EXISTS health_daily_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "LogDate" DATE NOT NULL,
    "SleepHours" NUMERIC(4, 2) NOT NULL DEFAULT 0,
    "SleepBedtime" VARCHAR(20) NULL,
    "SleepWakeTime" VARCHAR(20) NULL,
    "SleepQuality" INTEGER NOT NULL DEFAULT 3,
    "WaterIntakeMl" INTEGER NOT NULL DEFAULT 0,
    "WeightKg" NUMERIC(5, 2) NULL,
    "StepsCount" INTEGER NOT NULL DEFAULT 0,
    "WalkingDistanceKm" NUMERIC(6, 2) NULL,
    "BodyMeasurementsJson" VARCHAR(2000) NULL,
    "Notes" VARCHAR(1000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_health_daily_logs_User_Date" ON health_daily_logs ("UserId", "LogDate");

CREATE TABLE IF NOT EXISTS workout_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "WorkoutDate" DATE NOT NULL,
    "ActivityType" VARCHAR(50) NOT NULL,
    "DurationMinutes" INTEGER NOT NULL,
    "Intensity" VARCHAR(20) NOT NULL DEFAULT 'Medium',
    "CaloriesBurned" INTEGER NULL,
    "Notes" VARCHAR(1000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "MealDate" DATE NOT NULL,
    "MealType" VARCHAR(30) NOT NULL,
    "Description" VARCHAR(500) NOT NULL,
    "HealthyRating" INTEGER NOT NULL DEFAULT 3,
    "Notes" VARCHAR(500) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Knowledge Management
CREATE TABLE IF NOT EXISTS books (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Author" VARCHAR(150) NOT NULL,
    "TotalPages" INTEGER NOT NULL DEFAULT 0,
    "CurrentPage" INTEGER NOT NULL DEFAULT 0,
    "Status" VARCHAR(30) NOT NULL DEFAULT 'Reading',
    "Rating" INTEGER NOT NULL DEFAULT 5,
    "CoverImageUrl" VARCHAR(500) NULL,
    "StartedDate" DATE NULL,
    "FinishedDate" DATE NULL,
    "KeyLessons" VARCHAR(4000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_notes (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "BookId" UUID NULL REFERENCES books("Id") ON DELETE SET NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Content" TEXT NOT NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'Personal',
    "Tags" VARCHAR(300) NULL,
    "IsFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_personal_notes_User_Category" ON personal_notes ("UserId", "Category");

CREATE TABLE IF NOT EXISTS idea_items (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'General',
    "Status" VARCHAR(30) NOT NULL DEFAULT 'Raw',
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_quotes (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "BookId" UUID NULL,
    "QuoteText" VARCHAR(1000) NOT NULL,
    "Author" VARCHAR(150) NOT NULL,
    "Source" VARCHAR(250) NULL,
    "IsFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "Tags" VARCHAR(300) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Personal Finance
CREATE TABLE IF NOT EXISTS financial_transactions (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "TransactionDate" DATE NOT NULL,
    "Type" VARCHAR(20) NOT NULL,
    "Amount" NUMERIC(12, 2) NOT NULL,
    "Category" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(250) NOT NULL,
    "PaymentMethod" VARCHAR(50) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_financial_transactions_User_Date" ON financial_transactions ("UserId", "TransactionDate");

CREATE TABLE IF NOT EXISTS monthly_budgets (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Year" INTEGER NOT NULL,
    "Month" INTEGER NOT NULL,
    "Category" VARCHAR(50) NOT NULL,
    "BudgetAmount" NUMERIC(12, 2) NOT NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_monthly_budgets_User_Year_Month_Category" ON monthly_budgets ("UserId", "Year", "Month", "Category");

CREATE TABLE IF NOT EXISTS savings_goals (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(150) NOT NULL,
    "TargetAmount" NUMERIC(12, 2) NOT NULL,
    "CurrentAmount" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "TargetDate" DATE NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_items (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "CreditorName" VARCHAR(150) NOT NULL,
    "TotalAmount" NUMERIC(12, 2) NOT NULL,
    "RemainingAmount" NUMERIC(12, 2) NOT NULL,
    "InterestRate" NUMERIC(5, 2) NULL,
    "MinimumPayment" NUMERIC(12, 2) NULL,
    "DueDate" DATE NULL,
    "Notes" VARCHAR(500) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_items (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Name" VARCHAR(150) NOT NULL,
    "Cost" NUMERIC(10, 2) NOT NULL,
    "BillingCycle" VARCHAR(30) NOT NULL DEFAULT 'Monthly',
    "NextBillingDate" DATE NULL,
    "Category" VARCHAR(50) NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Gamification
CREATE TABLE IF NOT EXISTS gamification_profiles (
    "UserId" UUID PRIMARY KEY REFERENCES users("Id") ON DELETE CASCADE,
    "TotalXp" INTEGER NOT NULL DEFAULT 0,
    "Level" INTEGER NOT NULL DEFAULT 1,
    "TierTitle" VARCHAR(80) NOT NULL DEFAULT 'Novice Mariner',
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "BadgeKey" VARCHAR(80) NOT NULL,
    "Title" VARCHAR(150) NOT NULL,
    "Description" VARCHAR(300) NOT NULL,
    "Icon" VARCHAR(50) NOT NULL DEFAULT 'award',
    "Category" VARCHAR(50) NOT NULL DEFAULT 'General',
    "UnlockedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_user_achievements_User_Badge" ON user_achievements ("UserId", "BadgeKey");

CREATE TABLE IF NOT EXISTS daily_missions (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "MissionDate" DATE NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(500) NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'Habit',
    "TargetCount" INTEGER NOT NULL DEFAULT 1,
    "CurrentCount" INTEGER NOT NULL DEFAULT 0,
    "XpReward" INTEGER NOT NULL DEFAULT 50,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsClaimed" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_daily_missions_User_Date" ON daily_missions ("UserId", "MissionDate");

CREATE TABLE IF NOT EXISTS custom_rewards (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(150) NOT NULL,
    "XpCost" INTEGER NOT NULL DEFAULT 100,
    "Icon" VARCHAR(50) NOT NULL DEFAULT 'gift',
    "Description" VARCHAR(500) NULL,
    "IsRedeemed" BOOLEAN NOT NULL DEFAULT FALSE,
    "RedeemedAtUtc" TIMESTAMP WITH TIME ZONE NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Special Grandline Features
CREATE TABLE IF NOT EXISTS life_timeline_events (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "EventDate" DATE NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'Milestone',
    "ImageUrl" VARCHAR(500) NULL,
    "SignificanceLevel" INTEGER NOT NULL DEFAULT 3,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_life_timeline_events_User_Date" ON life_timeline_events ("UserId", "EventDate");

CREATE TABLE IF NOT EXISTS future_letters (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Content" TEXT NOT NULL,
    "WrittenDate" DATE NOT NULL,
    "UnlockDate" DATE NOT NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IX_future_letters_User_Unlock" ON future_letters ("UserId", "UnlockDate");

CREATE TABLE IF NOT EXISTS ninety_day_challenges (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "StartDate" DATE NOT NULL,
    "EndDate" DATE NOT NULL,
    "DailyAction" VARCHAR(300) NOT NULL,
    "Status" VARCHAR(30) NOT NULL DEFAULT 'Active',
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ninety_day_challenge_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ChallengeId" UUID NOT NULL REFERENCES ninety_day_challenges("Id") ON DELETE CASCADE,
    "DayNumber" INTEGER NOT NULL,
    "LogDate" DATE NOT NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "Notes" VARCHAR(500) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ninety_day_challenge_logs_Day" ON ninety_day_challenge_logs ("ChallengeId", "DayNumber");

CREATE TABLE IF NOT EXISTS personal_rules (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "RuleText" VARCHAR(250) NOT NULL,
    "Category" VARCHAR(50) NOT NULL DEFAULT 'General',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CurrentStreak" INTEGER NOT NULL DEFAULT 0,
    "BestStreak" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_rule_logs (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "RuleId" UUID NOT NULL REFERENCES personal_rules("Id") ON DELETE CASCADE,
    "LogDate" DATE NOT NULL,
    "Complied" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_personal_rule_logs_Date" ON personal_rule_logs ("RuleId", "LogDate");

CREATE TABLE IF NOT EXISTS digital_detoxes (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Title" VARCHAR(150) NOT NULL,
    "DistractingApps" VARCHAR(500) NOT NULL,
    "StartDate" DATE NOT NULL,
    "EndDate" DATE NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CleanDaysCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_reflections (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES users("Id") ON DELETE CASCADE,
    "Year" INTEGER NOT NULL,
    "Month" INTEGER NOT NULL,
    "Expectations" VARCHAR(2000) NULL,
    "Achievements" VARCHAR(2000) NULL,
    "BiggestImprovements" VARCHAR(2000) NULL,
    "ChallengesFaced" VARCHAR(2000) NULL,
    "LessonsLearned" VARCHAR(2000) NULL,
    "NextMonthPriorities" VARCHAR(2000) NULL,
    "CreatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAtUtc" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_monthly_reflections_User_Year_Month" ON monthly_reflections ("UserId", "Year", "Month");
