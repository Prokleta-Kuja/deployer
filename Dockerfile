FROM node:22.3.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    ;

WORKDIR /usr/src/app
ENV NODE_ENV production \
    HOST=example.com

COPY --chown=node:node ./package*.json /usr/src/app
RUN npm ci --omit=dev

COPY --chown=node:node ./dist /usr/src/app

VOLUME /sites

USER node
CMD ["dumb-init", "node", "index.js"]