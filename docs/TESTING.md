# Testing
## Backend
- `cd apps/backend && npm test`
  - health.test.ts — sanity
  - investor_access.test.ts — thresholds + discovery
  - messages.test.ts — chat send/list

## Frontend
- `cd apps/frontend && npx playwright install && npm run e2e`
- Update `playwright.config.ts` baseURL if your dev port differs.
