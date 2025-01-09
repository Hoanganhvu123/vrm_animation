# Base image
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy project files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 8080
EXPOSE 5173

# Start the application
CMD ["npm", "run", "start"] 