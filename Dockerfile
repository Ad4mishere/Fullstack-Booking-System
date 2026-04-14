# Use official Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all source code
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]