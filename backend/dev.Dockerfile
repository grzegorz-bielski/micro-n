FROM node:carbon

ENV BACKEND_PATH /backend
WORKDIR ${BACKEND_PATH}

COPY ./package-lock.json ${BACKEND_PATH}
COPY ./package.json ${BACKEND_PATH}
COPY ./src ${BACKEND_PATH}/src
COPY ./public ${BACKEND_PATH}/public
COPY ./index.js ${BACKEND_PATH}
COPY ./nodemon.json ${BACKEND_PATH}
COPY ./wait-for-it.sh ${BACKEND_PATH}

EXPOSE 3000
