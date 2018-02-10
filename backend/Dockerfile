FROM node:carbon

ENV BACKEND_PATH /backend
WORKDIR ${BACKEND_PATH}

COPY package-lock.json .
COPY package.json .
COPY src ./src
COPY public ./public
COPY index.js .
COPY nodemon.json .
COPY wait-for-it.sh .

EXPOSE 3000
