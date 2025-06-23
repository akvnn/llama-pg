# Development Stage
FROM node:22

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]
