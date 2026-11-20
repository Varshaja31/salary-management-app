# salary-backend-app

TypeScript Express backend starter.

## Stack

- **Runtime:** Node.js >= 20
- **Framework:** Express 4
- **Language:** TypeScript 5 (strict)
- **Logging:** pino + pino-http + pino-pretty (dev)
- **Env config:** dotenv + zod validation
- **Tooling:** ESLint, Prettier, Jest, ts-jest, tsx

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Server starts on `http://0.0.0.0:3001`.

## Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start dev server with `tsx watch`        |
| `npm run build`         | Compile `src/` to `dist/` via `tsc`       |
| `npm start`             | Run compiled server from `dist/`        |
| `npm run typecheck`     | Type-check without emitting             |
| `npm run lint`          | Run ESLint                               |
| `npm run lint:fix`      | Auto-fix lint issues                     |
| `npm run format`        | Format with Prettier                     |
| `npm run format:check`  | Check formatting                         |
| `npm test`              | Run Jest suite                           |
| `npm run test:watch`    | Watch-mode tests                         |
| `npm run test:coverage` | Tests with coverage report               |

## Project structure

```
.
├── src/
│   ├── config/
│   │   └── env.ts              # zod-validated environment config
│   ├── logger/
│   │   └── logger.ts           # pino logger instance
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── employees.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── index.ts        # aggregates v1 routes into v1Router
│   │   └── health.routes.ts    # infra probes (not versioned)
│   ├── app.ts                 # Express app factory + middleware
│   └── server.ts              # HTTP server entrypoint + graceful shutdown
├── test/
│   ├── employees.routes.test.ts
│   ├── health.routes.test.ts
│   └── users.routes.test.ts
├── .env.example
├── .eslintrc.cjs
├── .prettierrc.json
├── jest.config.cjs
├── tsconfig.json
└── tsconfig.build.json
```

## Endpoints

### Infra (root)

| Method | Path            | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/health`       | Liveness + uptime  |
| GET    | `/health/live`  | Liveness probe     |
| GET    | `/health/ready` | Readiness probe    |

### API v1 (mounted under `/v1`)


## Environment variables

See `.env.example`. All variables are validated with zod at startup; missing
or invalid values cause the process to exit immediately.
