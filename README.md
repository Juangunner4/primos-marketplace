# primos-marketplace
Solana NFT marketplace for the Primos collection.

## Running the project

The repository contains three applications:

* **backend** – a Quarkus service that exposes REST APIs and persists user
  information to MongoDB.
* **frontend** – a React interface that communicates with the backend and the
  Solana blockchain.
* **mobile** – a React Native application powered by Expo.

Environment variables for all services are stored under `frontend/.env`. A
`frontend/.env.test` file contains sample settings for the hosted test
environment.

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
`run-dev.ps1` for Windows environments. These scripts load environment
variables from `frontend/.env` by default.

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
frontend and backend and also starts a MongoDB instance. Environment values
for development live under `frontend/.env`. This file uses the connection
string `mongodb://mongodb:27017/primos-db` and sets `BACKEND_URL` to
`http://localhost:8080` so the browser can reach the backend when running the
containers locally. A `frontend/.env.test` file contains placeholders for the
hosted test environment and sets `QUARKUS_PROFILE=test` so the backend loads the
`application-test.properties` configuration. Run `docker compose --env-file frontend/.env.test` when testing against
that setup.

The environment files also specify a `CORS_ORIGINS` variable so the backend can
respond to requests from the frontend in both local and hosted environments.
Both files include a `REACT_APP_PRIMOS_COLLECTION` setting which the
frontend uses to identify the Primos NFT collection. The value defaults to
`primos` and generally does not need to be changed.

Run the following command from the repository root to start the entire stack:

```bash
docker compose up --build
```

The frontend will be available on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:8080](http://localhost:8080).

### Local Docker Image

Build the Docker images using the local development settings defined in `frontend/.env`:

```bash
docker compose --env-file frontend/.env build
```

After building, start the containers with:

```bash
docker compose --env-file frontend/.env up
```

### Test Docker Image

You can also build images using the settings in `frontend/.env.test` which mirror the
Render test environment:

```bash
docker compose --env-file frontend/.env.test build
```

Run the stack against the test configuration with:

```bash
docker compose --env-file frontend/.env.test up
```

### Combined Docker Image

Build a single container that serves both the backend and frontend:

```bash
docker build -t primos-app .
```

Run it with:

```bash
docker run -p 8080:8080 -p 3000:3000 primos-app
```

### Separate Repositories for Hosting

For deployment, push the `frontend` directory to its own GitHub repository for
Vercel. Render should use this entire repository so it can build a combined
container with both the backend and frontend. The backend API will be reachable
at `https://primos-marketplace.onrender.com` while the Vercel frontend is served
from `https://primos-marketplace.vercel.app`.

### Deploying to Render

The repository includes a `render.yaml` file that defines a Docker-based
service using the root `Dockerfile`. This image builds both applications so the
entire site is served from Render. Create an environment group in Render named
`primos-test` and populate it with the variables from `frontend/.env.test`. Set
`QUARKUS_PROFILE` to `test` so the backend loads `application-test.properties`.
When you connect the repository, Render will automatically build the container.
After deployment the site and API will be available at
`https://primos-marketplace.onrender.com`.

### Deploying to Vercel

The `vercel.json` file configures Vercel to build the React application from the
`frontend` directory. Create a new Vercel project using the frontend repository,
set the build command to `npm run build` and the output folder to `build`.
Define the environment variables from `frontend/.env.test` in your Vercel
Project Settings (or create them via the [REST API](https://vercel.com/docs/rest-api/reference))
so the site can communicate with the backend hosted on Render. Avoid keeping
environment values inside `vercel.json` as recommended in the
[configuration docs](https://vercel.com/docs/configuration#environment-variables).
The `frontend/api/proxy.js` file provides a serverless function that forwards
requests to Magic&nbsp;Eden, so make sure it is present in your frontend
repository and set `REACT_APP_MAGICEDEN_BASE` to `/api/proxy`. Once deployed the
site will be accessible at `https://primos-marketplace.vercel.app`.

### Troubleshooting Vercel Deploys

If `manifest.json` returns a `401` status or the Magic Eden routes under
`/api/proxy` respond with `502`, the most likely cause is missing environment
variables. Verify that all keys from `frontend/.env.test` are defined in your
Vercel project. In particular `REACT_APP_BACKEND_URL` and
`REACT_APP_MAGICEDEN_BASE` must be set so the React app can reach the backend
and proxy functions. When these values are absent the client falls back to
`localhost` and requests fail during page loads.

### Production MongoDB

Use the following MongoDB Atlas cluster for the initial production release:

```
mongodb+srv://<db_username>:<db_password>@cluster0.shjpril.mongodb.net/primos-db
```

Set this as the value of `QUARKUS_MONGODB_CONNECTION_STRING` in your hosting provider or a dedicated `.env.production` file so the backend uses the correct database. The `frontend/.env` file should keep the local `mongodb://mongodb:27017/primos-db` connection for development.
