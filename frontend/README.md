# Frontend

The frontend is built with React and communicates with the backend APIs and the
Solana blockchain.

To start it locally run:

```bash
npm install
npm start
```

Run the test suite with:

```bash
npm test -- --watchAll=false
```

### Docker

Build the frontend image (set the backend URL as needed):

```bash
docker build -t primos-frontend --build-arg BACKEND_URL=http://localhost:8080 .
```

Run it with:

```bash
docker run -p 3000:3000 primos-frontend
```


See [FUTURE_STATE.md](../FUTURE_STATE.md) for the release checklist.
