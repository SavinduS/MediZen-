# Step 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Declare build-time variables so Vite can bake them into the JS bundle
ARG VITE_GATEWAY_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

# Expose them as ENV so Vite picks them up during build
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
