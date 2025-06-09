# primos-marketplace
Solana NFT marketplace for the Primos collection.

## Running the project

The repository contains a Quarkus backend and a React frontend. Both can be
started independently during development.

### Backend

```bash
cd backend
./mvnw quarkus:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Tests for each portion can be run using `./mvnw test` in the backend directory
and `npm test -- --watchAll=false` in the frontend directory.

## Performance and Data Loading

The frontend fetches DAO member data and collection stats from the backend and
external APIs. To keep page loads fast:

1. Aggregate expensive calculations in the backend when possible (e.g. member
   NFT counts) and expose a single endpoint that returns all required fields.
2. Fetch data in parallel on the client so multiple API calls do not block one
   another.
3. Cache responses where appropriate to avoid repeated network requests.

The backend now exposes `/api/stats/member-nft-counts` which aggregates NFT
ownership counts for all DAO members. The frontend requests this endpoint in
parallel with other data so that expensive Helius queries happen server side and
are cached.

These practices help ensure pages render quickly even when pulling data from
several sources.
