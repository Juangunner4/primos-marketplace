# backend

The backend is implemented using [Quarkus](https://quarkus.io/) and exposes a
REST API backed by MongoDB.

### Development

Run the API locally with:

```bash
mvn quarkus:dev
```

Environment variables for both the backend and frontend live in
`../frontend/.env`. A `../frontend/.env.test` file provides settings for the
hosted test environment.

### Docker

Build the backend image:

```bash
docker build -t primos-backend .
```

Run the container using the values from `../frontend/.env`:

```bash
docker run --env-file ../frontend/.env -p 8080:8080 primos-backend
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
