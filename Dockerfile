FROM hub.hamdocker.ir/node:22.6

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/src/uploads/posts
RUN mkdir -p /app/src/uploads/images
RUN mkdir -p /app/src/uploads/messages


EXPOSE 8000

CMD ["npm", "start"]