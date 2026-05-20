# Use official Node runtime as parent image
FROM node:20-slim

# Set work directory
WORKDIR /app

# Copy dependency catalogs
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy application files
COPY . /app/

# Expose Vite dev server port
EXPOSE 3000

# Start Vite dev server in host mode for external port forwarding
CMD ["npm", "run", "dev", "--", "--host"]
