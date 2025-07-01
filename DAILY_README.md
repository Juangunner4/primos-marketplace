# Daily Development Notes

This file tracks the daily tasks for the project. Update it each day with the goals you plan to accomplish.

## TODO for 2025-07-01

- **Marketplace Transactions**
  - Review the current frontend and backend code to understand how NFT listings are fetched.
  - Research Solana transaction libraries compatible with React and Quarkus.
  - Add a backend service that can build and submit marketplace transactions.
  - Write tests for the transaction flow and verify wallet integration.

- **Mobile Transaction Card**
  - Fix layout issues on smaller screens.
  - Ensure the purchase flow works end to end on mobile devices.

- **Meshy AI Integration**
  - Create a new backend endpoint for requesting 3D model generation.
  - Store the Meshy API key in `frontend/.env` and reference it from the backend.
  - Begin wiring the new endpoint into the frontend so items can display rendered models.

## Enabling Marketplace Transactions

1. **Solana Wallet Integration** – ensure wallet providers are connected in `frontend/src/wallet` and test sending basic SOL transfers.
2. **Backend Transaction Service** – implement a new Quarkus service under `backend/src/main/java/.../service` that prepares and submits transactions to the blockchain. Reuse existing MongoDB models to store purchase data.
3. **API Endpoint** – expose a `/transactions` REST endpoint that accepts NFT identifiers and buyer information. The backend should return the transaction signature.
4. **Frontend Flow** – create React hooks that call the new endpoint and confirm the transaction on chain.

## Meshy AI for 3D Rendering

1. **API Key Configuration** – add `MESHY_API_KEY` to `frontend/.env` and export it to the backend container via `docker-compose.yml`.
2. **Backend Connector** – develop a client class in the backend that calls the Meshy AI REST API to generate models from images or metadata. Save returned model URLs in MongoDB.
3. **Serving Models** – extend the frontend NFT detail page to load the generated models using a 3D viewer library such as Three.js.
4. **Error Handling** – log failures from the Meshy AI service and provide user feedback when generation is in progress.
