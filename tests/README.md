# Grandline Test Suites & Verification

Grandline includes comprehensive test suites across both the backend (.NET 10) and frontend (React + TypeScript).

## Test Matrix

| Layer | Framework | Directory | Scope |
|---|---|---|---|
| **Backend Unit Tests** | xUnit, FluentAssertions, Moq | `backend/tests/Dayform.UnitTests/` | Domain logic, habit streak calculators, recurrence projections, validation logic |
| **Backend Integration Tests** | xUnit, WebApplicationFactory, EF Core InMemory | `backend/tests/Dayform.IntegrationTests/` | REST API endpoints, JWT authentication flows, tenant isolation guarantees |
| **Frontend Unit / Component Tests** | Vitest, React Testing Library, jsdom | `frontend/src/test/` | Page rendering, component behavior, auth state changes, form validation |
| **Frontend End-to-End (E2E)** | Playwright | `frontend/e2e/` | Browser workflows, user journeys, responsive layouts |

## Running Tests

### 1. Frontend Tests (Vitest)

```bash
cd frontend
npm run test
```

### 2. Frontend E2E Tests (Playwright)

```bash
cd frontend
npx playwright test
```

### 3. Backend Tests (.NET)

```bash
cd backend
dotnet test tests/Dayform.UnitTests/Dayform.UnitTests.csproj
dotnet test tests/Dayform.IntegrationTests/Dayform.IntegrationTests.csproj
```

