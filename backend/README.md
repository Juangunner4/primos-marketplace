# backend

The backend is implemented using [Quarkus](https://quarkus.io/) and exposes a
REST API backed by MongoDB.

### Development

Run the API locally with:

```bash
mvn quarkus:dev
```

### Docker

Build the backend image:

```bash
docker build -t primos-backend .
```

Run the container (replace the Mongo connection string if needed):

```bash
docker run -p 8080:8080 \
  -e QUARKUS_MONGODB_CONNECTION_STRING=mongodb://localhost:27017/primos-db \
  -e CORS_ORIGINS=http://localhost:3000 \
  primos-backend
```

### Tests

Execute the test suite using:

```bash
mvn test
```

```bash
mvn package -Dnative
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```bash
mvn package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/backend-1.0.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Related Guides

- REST ([guide](https://quarkus.io/guides/rest)): A Jakarta REST implementation utilizing build time processing and Vert.x. This extension is not compatible with the quarkus-resteasy extension, or any of the extensions that depend on it.
- MongoDB with Panache ([guide](https://quarkus.io/guides/mongodb-panache)): Simplify your persistence code for MongoDB via the active record or the repository pattern
- SmallRye OpenAPI ([guide](https://quarkus.io/guides/openapi-swaggerui)): Document your REST APIs with OpenAPI - comes with Swagger UI
