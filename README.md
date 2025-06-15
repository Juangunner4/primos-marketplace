# primos-marketplace
Solana NFT marketplace for the Primos collection.

## Running the project

The repository contains three applications:

* **backend** – a Quarkus service that exposes REST APIs and persists user
  information to MongoDB.
* **frontend** – a React interface that communicates with the backend and the
  Solana blockchain.
* **mobile** – a React Native application powered by Expo.

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

Tests for each portion can be run using `mvn test` in the backend directory and
`npm test -- --watchAll=false` in the frontend directory.

## Performance and Data Loading

The frontend communicates directly with Solana and other Web3 services. The
backend simply reads and writes user information from MongoDB. This keeps the
on‑chain logic in the client and makes the server lightweight.
