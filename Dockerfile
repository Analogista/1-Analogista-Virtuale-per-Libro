# Fase 1: Build dell'applicazione
FROM node:22-alpine AS builder

WORKDIR /app

# Copia i file delle dipendenze
COPY package*.json ./
COPY bun.lock ./

# Installa le dipendenze
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copia il resto del codice sorgente
COPY . .

# Build dell'app Vite
RUN npm run build

# Fase 2: Immagine di produzione
FROM node:22-alpine

WORKDIR /app

# Copia i file necessari dalla fase di build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# Installa solo le dipendenze di produzione
RUN npm install express dotenv esbuild --legacy-peer-deps

# Esponi la porta
EXPOSE 8080

# Comando di avvio
CMD ["node", "-r", "esbuild-register", "server.ts"]
