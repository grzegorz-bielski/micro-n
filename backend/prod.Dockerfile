FROM node:carbon

ENV BACKEND_PATH /backend
WORKDIR ${BACKEND_PATH}

COPY package-lock.json .
COPY package.json .
COPY wait-for-it.sh .
COPY public ./public

USER node

EXPOSE 3000
