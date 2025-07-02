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
# Using `npm install` instead of `npm ci` allows the build to
# succeed even when `package-lock.json` is out of sync with
# `package.json`.
RUN npm install --legacy-peer-deps
COPY frontend /frontend
# URL of the backend API used by the React build
ARG BACKEND_URL=https://primos-marketplace.onrender.com
ARG PRIMOS_COLLECTION=2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb
ARG REACT_APP_HELIUS_API_KEY
ENV REACT_APP_BACKEND_URL=$BACKEND_URL
ENV REACT_APP_PRIMOS_COLLECTION=$PRIMOS_COLLECTION
ENV REACT_APP_HELIUS_API_KEY=$REACT_APP_HELIUS_API_KEY
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

# Add build args for all env vars
ARG BACKEND_URL
ARG REACT_APP_BACKEND_URL
ARG CORS_ORIGINS
ARG REACT_APP_PRIMOS_COLLECTION
ARG REACT_APP_MAGICEDEN_BASE
ARG REACT_APP_HELIUS_API_KEY
ARG QUARKUS_PROFILE
ARG QUARKUS_MONGODB_CONNECTION_STRING
ARG REACT_APP_ADMIN_WALLET

ENV BACKEND_URL=$BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV CORS_ORIGINS=$CORS_ORIGINS
ENV REACT_APP_PRIMOS_COLLECTION=$REACT_APP_PRIMOS_COLLECTION
ENV REACT_APP_MAGICEDEN_BASE=$REACT_APP_MAGICEDEN_BASE
ENV REACT_APP_HELIUS_API_KEY=$REACT_APP_HELIUS_API_KEY
ENV QUARKUS_PROFILE=$QUARKUS_PROFILE
ENV QUARKUS_MONGODB_CONNECTION_STRING=$QUARKUS_MONGODB_CONNECTION_STRING
ENV REACT_APP_ADMIN_WALLET=$REACT_APP_ADMIN_WALLET
