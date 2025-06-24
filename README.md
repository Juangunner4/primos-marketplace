# primos-marketplace
Solana NFT marketplace for the Primos collection.

## Running the project

The repository contains three applications:

* **backend** – a Quarkus service that exposes REST APIs and persists user
  information to MongoDB.
* **frontend** – a React interface that communicates with the backend and the
  Solana blockchain.
* **mobile** – a React Native application powered by Expo.

### Beta Access

The backend restricts logins to users with a valid beta code. Thirty beta codes
are generated on startup. A code is required when a wallet logs in for the first
time and is consumed afterwards.

### Admin Page

Logging in with the admin wallet enables an additional page accessible from the profile screen. Set
the wallet address via the `ADMIN_WALLET` environment variable (defaults to the project's demo value).
The admin can create and view beta codes which are stored in MongoDB.

Both can be started independently during development or together using the
`run-dev.sh` helper script. A PowerShell version is available as
`run-dev.ps1` for Windows environments.

### Backend

```bash
cd backend
mvn quarkus:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

There are currently no automated tests for the mobile app.

Tests for each portion can be run using `mvn test` in the backend directory and
`npm test -- --watchAll=false` in the frontend directory.

## Performance and Data Loading

The frontend communicates directly with Solana and other Web3 services. The
backend simply reads and writes user information from MongoDB. This keeps the
on‑chain logic in the client and makes the server lightweight.

## Internationalization

Translations for the web frontend are stored under `frontend/src/locales`. The mobile app uses the same `i18next` setup with JSON files located in `mobile/locales`.

## Docker Setup

The repository includes a `docker-compose.yml` file that builds images for the
frontend and backend and also starts a MongoDB instance. Environment values are
read from a `.env` file. An example configuration for local development is
provided in `.env`, which uses the connection string `mongodb://mongodb:27017/primos-db`.
It also sets `BACKEND_URL` to `http://localhost:8080` so the browser can reach the backend when running the containers locally.
The `.env.test` file contains placeholders for the test environment on Render.
Use it with `docker compose --env-file .env.test` when running locally against
the test setup.

The `.env` files also specify a `CORS_ORIGINS` variable so the backend can
respond to requests from the frontend in both local and hosted environments.

Run the following command from the repository root to start the entire stack:

```bash
docker compose up --build
```

The frontend will be available on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:8080](http://localhost:8080).

### Local Docker Image

Build the Docker images using the local development settings defined in `.env`:

```bash
docker compose --env-file .env build
```

After building, start the containers with:

```bash
docker compose --env-file .env up
```

### Test Docker Image

You can also build images using the settings in `.env.test` which mirror the
Render test environment:

```bash
docker compose --env-file .env.test build
```

Run the stack against the test configuration with:

```bash
docker compose --env-file .env.test up
```

### Deploying to Render

The repository includes a `render.yaml` file that defines Docker-based services for the backend and frontend. Create an environment group in Render named `primos-test` and supply values for variables such as `QUARKUS_MONGODB_CONNECTION_STRING`. When you connect the repository, Render will automatically create the services using the Dockerfiles under `backend` and `frontend`.

### Production MongoDB

Use the following MongoDB Atlas cluster for the initial production release:

```
mongodb+srv://<db_username>:<db_password>@cluster0.shjpril.mongodb.net/primos-db
```

Set this as the value of `QUARKUS_MONGODB_CONNECTION_STRING` in your hosting provider or a dedicated `.env.production` file so the backend uses the correct database. The `.env` file should keep the local `mongodb://mongodb:27017/primos-db` connection for development.
