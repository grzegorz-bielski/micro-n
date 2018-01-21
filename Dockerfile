FROM node:latest

WORKDIR /app

COPY package-lock.json .
COPY package.json .

RUN npm install

ENV NODE_ENV production

COPY dist .
COPY wait-for-it.sh .

CMD ["node","server.js"]

USER node