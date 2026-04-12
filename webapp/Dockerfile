# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
# Install deps
COPY package.json package-lock.json ./
RUN npm ci --silent
# Copy sources
COPY . .
# Accept build-time API url (defaults to localhost:3000)
ARG VITE_API_URL="http://localhost:3000"
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GAMEY_URL="http://localhost:4000"
ENV VITE_GAMEY_URL=$VITE_GAMEY_URL
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
RUN npm run build
# Production image
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
