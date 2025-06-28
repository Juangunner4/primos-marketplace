# Future State

This document outlines the steps required to bring Primos Marketplace to a production ready release.  It serves as a planning checklist for the tasks that still need to be completed.

## Outstanding Items

- **Complete Test Coverage** – ensure both the backend and frontend test suites run in CI and cover all critical functionality.  Integration tests against a real MongoDB instance should be added.
- **Security Review** – audit API endpoints, validate inputs and confirm CORS settings before launch.
- **CI/CD Pipeline** – configure automated builds for Docker images and deployments to Render and Vercel.  Secrets should be stored using each provider's environment management.
- **Monitoring** – add logging and metrics for user actions and API errors.  Services like Grafana or Sentry can be integrated for alerts.
- **Data Backups** – configure automated MongoDB backups of the production database.

## Preparing for Production

1. Populate `frontend/.env.production` with all required keys including the MongoDB connection string and Solana RPC endpoints.
2. Create the environment group in Render and upload the variables from `.env.production`.
3. Connect this repository to Render so that pushes to `main` trigger a new container build.
4. Deploy the frontend from the `frontend` directory to Vercel using its own repository or by exporting the build artifacts from Render.
5. Run `mvn package` in the backend and `npm run build` in the frontend to verify that production builds succeed.

Once these tasks are complete the project will be ready for a full production launch.
