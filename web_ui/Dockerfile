# Makefile for the Sidekick web UI
# React implementation of Sidekick UI

FROM node:20-alpine
WORKDIR /web_ui
COPY . .
RUN npm install
RUN npm run build
EXPOSE 8081
CMD [ "npm", "run", "start-container"]
