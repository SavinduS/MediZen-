# Use the official lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Expose the official port for Doctor Service
EXPOSE 5003

# Command to run the service
CMD ["node", "src/index.js"]