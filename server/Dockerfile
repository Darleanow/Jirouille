FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx tsc --project tsconfig.json

RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]