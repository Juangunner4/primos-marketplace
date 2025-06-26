# Build backend
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /backend
# Copy only the POM first so Maven can cache dependencies
COPY backend/pom.xml ./pom.xml
RUN mvn -q dependency:go-offline
COPY backend /backend
RUN mvn -q package -DskipTests

# Build frontend
FROM node:18 AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY frontend /frontend
# URL of the backend API used by the React build
ARG BACKEND_URL=https://primos-marketplace.onrender.com
ARG PRIMOS_COLLECTION=primos
ENV REACT_APP_BACKEND_URL=$BACKEND_URL
ENV REACT_APP_PRIMOS_COLLECTION=$PRIMOS_COLLECTION
RUN npm run build

# Final image
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y nginx gettext-base \
    && rm -rf /var/lib/apt/lists/*
# copy backend
COPY --from=backend-build /backend/target/quarkus-app/lib/ ./backend/lib/
COPY --from=backend-build /backend/target/quarkus-app/*.jar ./backend/
COPY --from=backend-build /backend/target/quarkus-app/app/ ./backend/app/
COPY --from=backend-build /backend/target/quarkus-app/quarkus/ ./backend/quarkus/
# copy frontend to nginx html directory
COPY --from=frontend-build /frontend/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/bin/sh","/docker-entrypoint.sh"]
