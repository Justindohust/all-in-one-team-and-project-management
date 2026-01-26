# Use nginx alpine for lightweight static file serving
FROM nginx:alpine

# Copy all static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY views/ /usr/share/nginx/html/views/
COPY resources/ /usr/share/nginx/html/resources/

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
