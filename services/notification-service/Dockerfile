# Base image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose service port
EXPOSE 5008

# Start command
CMD [ "npm", "start" ]
