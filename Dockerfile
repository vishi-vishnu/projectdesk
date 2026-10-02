# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# (The VITE_FIREBASE_* values below are the public web config, not secrets.)

# ---- build stage: install deps and compile the static bundle ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Firebase web config is public by design (security rules protect the data),
# so the defaults point at the live project. A fork overrides them with
# --build-arg VITE_FIREBASE_PROJECT_ID=... and so on.
ARG VITE_FIREBASE_API_KEY=AIzaSyBMUtf4jbg1xHDmSGwMswozc1mP0seg5HQ
ARG VITE_FIREBASE_AUTH_DOMAIN=projectdesk-1de07.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=projectdesk-1de07
ARG VITE_FIREBASE_STORAGE_BUCKET=projectdesk-1de07.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=86854104011
ARG VITE_FIREBASE_APP_ID=1:86854104011:web:0d52c2074fe2671624fc4e
ARG VITE_STORAGE_PROVIDER=cloudinary
ARG VITE_DEMO_ACCOUNTS=true
RUN npx vite build

# ---- runtime stage: static files behind nginx (~25 MB image) ----
FROM nginx:1.31-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/Vishi-vishnu/projectdesk" \
      org.opencontainers.image.description="ProjectDesk: final-year project registration and reviews" \
      org.opencontainers.image.licenses="MIT"
# Where /api/ calls are forwarded (the Vercel serverless functions).
ENV API_ORIGIN=https://projectdesk-three.vercel.app
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
