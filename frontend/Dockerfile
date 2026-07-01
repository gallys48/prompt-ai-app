FROM node:22-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1


FROM base AS dev

COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]


FROM base AS builder

ARG NEXT_PUBLIC_API_BASE_URL=/api/v1

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm run build


FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=/api/v1

COPY --from=builder /app ./

RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]