# Backend (NestJS + Prisma)

See the main [README](../README.md) for setup, API reference, environment variables and deployment.

```bash
npm install
npx prisma migrate deploy
npm run start:dev      # http://localhost:4000/health
npm test               # engine parity tests (63 Python reference designs)
npm run test:e2e       # API + database tests (needs docker compose up -d)
```
