#base Image
From node:10

#Author
MAINTAINER Rob V

COPY . /app
WORKDIR /app
COPY ./assign1/ /app

RUN npm install

EXPOSE 80
EXPOSE 3000

CMD ["node", "app.js"]