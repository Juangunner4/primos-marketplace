FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG BACKEND_URL=http://localhost:8080
ENV REACT_APP_BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/build ./build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve","-s","build"]
