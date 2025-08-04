# primos-marketplace
Solana NFT marketplace for the Primos collection. Recent updates add
an "All Contracts" view for exploring commonly scanned addresses and
optimize Primo holder checks via the Helius API.

## Running the project

The repository contains three applications:

* **backend** – a Quarkus service that exposes REST APIs and persists user
  information to MongoDB.
* **frontend** – a React interface that communicates with the backend and the
  Solana blockchain.
* **mobile** – a React Native application powered by Expo.

Copy `frontend/.env.example` to `.env` and update the values for local
development. Vercel should use environment variables defined in the project
settings while Render can load values from a `.env.production` file.

The project integrates with Meshy.ai for converting images to 3D models. Provide
your API key via the `MESHY_API_KEY` variable in `.env` so the backend can
authenticate requests.

Token stats shown in the Telegram panel come from the
[CoinGecko API](https://docs.coingecko.com/v3.0.1/reference/coins-contract-address).
Set `COINGECKO_API_BASE` if you need to override the default endpoint.

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

### Next.js Transaction Server

If you prefer to keep Web3 logic in JavaScript, you can build the transaction
APIs with a small Next.js server. Create API routes under `pages/api` that
prepare and submit Solana instructions. Running `npm run dev` in that server
will expose the endpoints on <http://localhost:3000/api> for the frontend to
consume.

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

The backend and frontend are fully covered by unit tests which run in the CI
pipeline. Execute `mvn test` inside the `backend` directory and `npm test --
--watchAll=false` inside `frontend` to run them locally. The mobile app does not
yet include automated tests.

## Performance and Data Loading

The frontend communicates directly with Solana and other Web3 services. The
backend simply reads and writes user information from MongoDB. This keeps the
on‑chain logic in the client and makes the server lightweight.

## Internationalization

Translations for the web frontend are stored under `frontend/src/locales`. The mobile app uses the same `i18next` setup with JSON files located in `mobile/locales`. English and Spanish translations are provided by default, including labels for market data such as price, market cap, 24h volume and last updated.

## Docker Setup

The repository includes a `docker-compose.yml` file that builds images for the
frontend and backend and also starts a MongoDB instance. Copy
`frontend/.env.example` to `frontend/.env` and adjust the values for development.
This file uses the connection
string `mongodb://mongodb:27017/primos-db` and sets `BACKEND_URL` to
`http://localhost:8080` so the browser can reach the backend when running the
containers locally. A `frontend/.env.test` file contains placeholders for the
Vercel test deployment and sets `QUARKUS_PROFILE=test` so the backend loads the
`application-test.properties` configuration. A separate
`frontend/.env.production` file defines the values used on Render.
Run `docker compose --env-file frontend/.env.test` when testing against
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
Vercel test environment:

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
docker run -p 8080:8080 -p 3000:3000 -e CORS_ORIGINS=http://localhost:3000 primos-app
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
entire site is served from Render. Create an environment group in Render and
populate it with the variables from `frontend/.env.production`.
`REACT_APP_MAGICEDEN_BASE=/api/proxy` must be provided so the React build uses
the backend proxy for Magic Eden requests. `REACT_APP_HELIUS_API_KEY` must also
be set so the marketplace can query NFT metadata from Helius. Additionally, define
`MAGICEDEN_API_KEY` so the backend can request transaction instructions from
Magic&nbsp;Eden's private API. When you connect the repository,
Render will automatically build the container. After deployment the site and API
will be available at `https://primos-marketplace.onrender.com`.

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

Provide your MongoDB Atlas connection string as the value of
`QUARKUS_MONGODB_CONNECTION_STRING` in your hosting provider or a dedicated
`.env.production` file so the backend uses the correct database. The
`application.properties` file already specifies `primos-db` as the default
database name, so you only need the cluster connection string here. The
`frontend/.env` example keeps the local `mongodb://localhost:27017/primos-db`
connection for development.

## Production Status

Primos Marketplace is now production ready. Historical planning notes remain in
[FUTURE_STATE.md](./FUTURE_STATE.md) for reference.
