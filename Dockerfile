# Build stage - build Tailwind CSS
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tailwind.config.js ./
COPY css/ ./css/
COPY index.html ./
COPY js/ ./js/
COPY views/ ./views/

# Install dependencies and build CSS
RUN npm install
RUN npm run build:css

# Production stage - serve with nginx
FROM nginx:alpine

# Copy all static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY views/ /usr/share/nginx/html/views/
COPY resources/ /usr/share/nginx/html/resources/
COPY favicon.svg /usr/share/nginx/html/
COPY favicon.svg /usr/share/nginx/html/favicon.ico

# Copy built CSS from builder stage
COPY --from=builder /app/css/output.css /usr/share/nginx/html/css/output.css

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
