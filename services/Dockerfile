FROM node:24

WORKDIR /app/services

COPY services/package*.json ./

RUN npm install

COPY services ./
COPY model /app/model
COPY front /app/front

CMD ["npm", "run", "start"]
