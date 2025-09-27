# Weys Marketplace Frontend

The web interface is a React application bootstrapped with Create React App and configured with CRACO. It communicates with the backend and directly with the Solana blockchain.

## Development

```bash
npm ci
npm start
```

Environment variables are defined in `.env`. Copy `./.env.example` to `.env` and adjust the values for local development.

### Testing

Run unit tests with:

```bash
npm test -- --watchAll=false
```
