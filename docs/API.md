# DAYFORM REST API Reference

Base URL: `/api/v1`

All successful JSON responses wrap payloads in the standard `ApiResponse<T>` envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

All error responses return RFC 7807 `application/problem+json` (`ProblemDetails`) with `status`, `title`, `detail`, `type`, `traceId`, and optional `errors` (validation dictionary) or `errorCode`.

---

## Authentication (`/api/v1/auth`)

Refresh tokens are stored hashed (SHA-256) in PostgreSQL and transmitted as an `HttpOnly`, `SameSite=Lax` cookie (`dayform_refresh_token`, path `/api/v1/auth`). Access tokens are short-lived JWT Bearer tokens kept in memory on the client.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public (rate-limited) | Create a user account, return JWT + set refresh cookie. |
| `POST` | `/api/v1/auth/login` | Public (rate-limited) | Authenticate email/password, return JWT + set refresh cookie. |
| `POST` | `/api/v1/auth/refresh` | Cookie | Rotate refresh token cookie and issue a new JWT access token. |
| `POST` | `/api/v1/auth/logout` | Public/Cookie | Revoke active refresh token and clear refresh cookie (`204`). |
| `POST` | `/api/v1/auth/forgot-password` | Public (rate-limited) | Create single-use reset token (returns `developmentResetToken` only in `Development`). |
| `POST` | `/api/v1/auth/reset-password` | Public (rate-limited) | Verify reset token, update password hash, revoke existing refresh tokens. |
| `GET` | `/api/v1/auth/me` | Bearer | Get authenticated `UserDto`. |
| `POST` | `/api/v1/auth/demo-login` | Dev-only | Sign into deterministic demo user (returns `404` outside `Development` or when `Demo:Enabled=false`). |
| `POST` | `/api/v1/auth/demo-reset` | Bearer + Dev-only + Demo user | Reset the demo user's 5-month dataset (`403` for non-demo users, `404` outside `Development`). |

### Example `RegisterRequest`
```json
{
  "displayName": "Alex Morgan",
  "email": "alex@example.com",
  "password": "Password123!",
  "timeZoneId": "UTC"
}
```

---

## Health (`/api/v1/health`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Liveness check (`{ "status": "healthy", "service": "DAYFORM.Api" }`). |

---

## Dashboard (`/api/v1/dashboard`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard?date=YYYY-MM-DD` | Bearer | Aggregated today ring stats, 7-day activity series, streaks, today's habits, and recent memories. |

---

## Habits (`/api/v1/habits`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/habits?category=&includeArchived=false&date=YYYY-MM-DD` | Bearer | List user habits with completion state for `date`. |
| `GET` | `/api/v1/habits/summary?date=YYYY-MM-DD` | Bearer | Weekly completion average, current streak, best streak, active habit count. |
| `GET` | `/api/v1/habits/heatmap?weeks=21&date=YYYY-MM-DD` | Bearer | Daily completion intensity levels (`0..4`) for 21-week heatmap. |
| `GET` | `/api/v1/habits/{id}?date=YYYY-MM-DD` | Bearer | Single habit (`404` if owned by another user). |
| `POST` | `/api/v1/habits` | Bearer | Create a habit (`name`, `category`, `target`, `icon`, `color`). |
| `PUT` | `/api/v1/habits/{id}` | Bearer | Update or archive (`isActive: false`) a habit. |
| `DELETE` | `/api/v1/habits/{id}` | Bearer | Permanently delete habit and its check-in logs (`204`). |
| `GET` | `/api/v1/habits/{id}/logs?from=&to=` | Bearer | List check-in logs for a habit within an optional date range. |
| `PUT` | `/api/v1/habits/{id}/logs/{date}` | Bearer | Idempotent check-in upsert (`{ "isCompleted": true }`). |

---

## Study (`/api/v1/learning-paths` & `/api/v1/study-sessions`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/learning-paths?includeArchived=false` | Bearer | List learning paths with total minutes and session counts. |
| `GET` | `/api/v1/learning-paths/{id}` | Bearer | Get single learning path. |
| `POST` | `/api/v1/learning-paths` | Bearer | Create learning path (`name`, `description`, `icon`, `targetMinutes`, `progress`). |
| `PUT` | `/api/v1/learning-paths/{id}` | Bearer | Update or archive learning path. |
| `DELETE` | `/api/v1/learning-paths/{id}` | Bearer | Delete learning path; linked sessions remain with `learningPathId = null` (`204`). |
| `GET` | `/api/v1/study-sessions?learningPathId=&from=&to=&page=1&pageSize=20` | Bearer | Paginated study session history. |
| `GET` | `/api/v1/study-sessions/summary?date=YYYY-MM-DD` | Bearer | Total minutes/sessions all-time and last 7 days. |
| `GET` | `/api/v1/study-sessions/{id}` | Bearer | Get single study session. |
| `POST` | `/api/v1/study-sessions` | Bearer | Log session; idempotent when `clientSessionKey` matches an existing row for the user. |
| `PUT` | `/api/v1/study-sessions/{id}` | Bearer | Update study session. |
| `DELETE` | `/api/v1/study-sessions/{id}` | Bearer | Delete study session (`204`). |

---

## Memories & Images (`/api/v1/memories`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/memories?category=&page=1&pageSize=50` | Bearer | Paginated memories filtered by optional `Everyday | Travel | Milestone`. |
| `GET` | `/api/v1/memories/{id}` | Bearer | Get single memory with optional `image` metadata. |
| `POST` | `/api/v1/memories` | Bearer | Create memory (`title`, `memoryDate`, `category`, `note`, `icon`). |
| `PUT` | `/api/v1/memories/{id}` | Bearer | Update memory metadata. |
| `DELETE` | `/api/v1/memories/{id}` | Bearer | Delete memory and clean up its Cloudinary asset if present (`204`). |
| `POST` | `/api/v1/memories/{id}/image` | Bearer | `multipart/form-data` upload (`file`). Validates JPEG/PNG/WebP/GIF MIME, <= 5 MB, and file signature bytes before uploading server-side to Cloudinary. |
| `DELETE` | `/api/v1/memories/{id}/image` | Bearer | Delete associated Cloudinary asset and `media_assets` record. |

---

## Planner & Reminders (`/api/v1/reminders` & `/api/v1/planner`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/reminders?activeOnly=false` | Bearer | List reminders (`Never | Daily | Weekly | Monthly | Yearly`). |
| `GET` | `/api/v1/reminders/{id}` | Bearer | Get single reminder. |
| `POST` | `/api/v1/reminders` | Bearer | Create reminder (`title`, `reminderDate`, `reminderTime`, `repeatFrequency`). |
| `PUT` | `/api/v1/reminders/{id}` | Bearer | Update reminder. |
| `DELETE` | `/api/v1/reminders/{id}` | Bearer | Delete reminder (`204`). |
| `GET` | `/api/v1/planner/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` | Bearer | Projected calendar day summaries including habit completions, study minutes, memories, and expanded recurring reminder occurrences (read-only projection; no duplicate rows created). |

---

## Journal (`/api/v1/journals`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/journals?page=1&pageSize=20` | Bearer | Paginated past reflection entries. |
| `GET` | `/api/v1/journals/{date}` | Bearer | Get entry for `YYYY-MM-DD` (`data: null` if none exists). |
| `PUT` | `/api/v1/journals/{date}` | Bearer | Upsert daily 3-prompt reflection (`accomplishments`, `distractions`, `improvements`). |
| `DELETE` | `/api/v1/journals/{date}` | Bearer | Delete reflection for `YYYY-MM-DD` (`204`). |

---

## Progress Analytics (`/api/v1/progress`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/progress/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Bearer | Habit average, previous-period delta, study minutes/sessions, memories count, data-backed insights, and 180-day journey phase. |
| `GET` | `/api/v1/progress/habits?from=YYYY-MM-DD&to=YYYY-MM-DD` | Bearer | Habit completion chart buckets (`day` or `week` granularity). |
| `GET` | `/api/v1/progress/study?from=YYYY-MM-DD&to=YYYY-MM-DD` | Bearer | Study chart buckets plus calculated `bestWeekday`. |
| `GET` | `/api/v1/progress/monthly?months=5&date=YYYY-MM-DD` | Bearer | Month-by-month habit %, study time, and memory count breakdown. |

---

## Profile & Data Export (`/api/v1/profile`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/profile` | Bearer | Get current user's profile and preferences. |
| `PUT` | `/api/v1/profile` | Bearer | Update `displayName`, `themePreference` (`Auto | Light | Dark`), `timeZoneId`, and `journeyStartDate`. |
| `GET` | `/api/v1/profile/export` | Bearer | Download complete JSON export of the authenticated user's records. |

