FROM library/node:slim

COPY . /app

RUN cd /app \
  && npm install --production

WORKDIR /app
