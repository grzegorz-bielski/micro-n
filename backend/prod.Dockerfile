FROM node:carbon

ENV BACKEND_PATH /backend
WORKDIR ${BACKEND_PATH}

ADD ./package-lock.json ${BACKEND_PATH}
ADD ./package.json ${BACKEND_PATH}
ADD ./wait-for-it.sh ${BACKEND_PATH}
ADD ./public ${BACKEND_PATH}/public

USER node

EXPOSE 3000
