# Makefile for the Sidekick web UI
# React implementation of Sidekick UI

FROM node:20-alpine
WORKDIR /web_ui

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build the app
RUN npm run build

# expose port and run app
EXPOSE 8081
#CMD [ "npx", "serve", "-s", "build"]
CMD [ "npm", "run", "start-container" ]
