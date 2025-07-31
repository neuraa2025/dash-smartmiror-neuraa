FROM node:18.15-alpine as build-stage

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY --chown=node . .
COPY --chown=node .env.prod /home/node/app/.env

RUN npm install --force && npm run build

FROM nginx:alpine as production-stage
RUN mkdir /app
COPY --from=build-stage /home/node/app/dist /app
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80/tcp 
# CMD ["npm", "run" ,"serve"]




   