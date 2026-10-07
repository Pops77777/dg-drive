FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Environment defaults for Hugging Face Spaces & container hosting
ENV NODE_ENV=production
ENV PORT=7860
ENV LISTEN_HOST=0.0.0.0
ENV TRUST_PROXY_HTTPS=true

# Ensure data directory exists
RUN mkdir -p data/uploads data/cache

EXPOSE 7860

CMD ["node", "server.js"]
