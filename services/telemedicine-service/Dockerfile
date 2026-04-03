FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Expose the official port for Telemedicine Service
EXPOSE 5006

CMD ["node", "src/index.js"]