# Primos Marketplace Backend

This service is built with [Quarkus](https://quarkus.io/) and exposes the REST APIs consumed by the web and mobile clients. It persists data to MongoDB and handles scheduled jobs such as daily point accrual.

## Running Locally

```bash
mvn quarkus:dev
```

The backend expects a MongoDB instance available at the connection string defined by `QUARKUS_MONGODB_CONNECTION_STRING`. See `../docker-compose.yml` for a local setup.

Run the test suite with:

```bash
mvn test
```
