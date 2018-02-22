FROM node:carbon

ENV BACKEND_PATH /backend
WORKDIR ${BACKEND_PATH}

ADD ./package-lock.json ${BACKEND_PATH}
ADD ./package.json ${BACKEND_PATH}
ADD ./wait-for-it.sh ${BACKEND_PATH}
ADD ./public ${BACKEND_PATH}/public

RUN mkdir -p ${BACKEND_PATH}/dist
RUN chmod 755 ${BACKEND_PATH}/dist -R
RUN npm install && npm run prestart:prod
CMD npm run start:prod

USER node

EXPOSE 3000
