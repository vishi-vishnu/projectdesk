# syntax=docker/dockerfile:1

# ---- build stage: install deps and compile the static bundle ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Firebase web config is public by design; pass it at build time.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_STORAGE_PROVIDER=firebase
RUN npx vite build

# ---- runtime stage: static files behind nginx (~25 MB image) ----
FROM nginx:1.31-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/Vishi-vishnu/projectdesk" \
      org.opencontainers.image.description="ProjectDesk: final-year project registration and reviews" \
      org.opencontainers.image.licenses="MIT"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
