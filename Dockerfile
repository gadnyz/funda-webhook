FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV APP_ENV=production

COPY package.json ./
COPY src ./src
COPY scripts ./scripts
COPY README.md ./

RUN mkdir -p /app/data/backups

EXPOSE 3000
CMD ["npm", "run", "start"]
