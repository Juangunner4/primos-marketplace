# primos-marketplace
Solana NFT MarketPlace for Primos

## Performance and Data Loading

The frontend fetches DAO member data and collection stats from the backend and
external APIs. To keep page loads fast:

1. Aggregate expensive calculations in the backend when possible (e.g. member
   NFT counts) and expose a single endpoint that returns all required fields.
2. Fetch data in parallel on the client so multiple API calls do not block one
   another.
3. Cache responses where appropriate to avoid repeated network requests.

These practices help ensure pages render quickly even when pulling data from
several sources.
