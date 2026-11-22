# Persistence sits behind a UserRepository interface with memory and Postgres implementations

All user, token and billing-event storage goes through `UserRepository` (`src/repository.ts`). `src/repository.postgres.ts` backs production and `src/repository.memory.ts` backs tests and local development, so the route and engine code never touch SQL and most tests run without a database. Schema changes are plain SQL files in `migrations/`, applied by `MigrationRunner`.

The cost is that every new storage operation must be implemented twice and kept in parity; the Postgres integration test guards that against a real database.
