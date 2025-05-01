FROM node:18
#RUN apt-get update && apt-get install -y build-essential
#RUN wget https://github.com/google/toktx/releases/download/v1.0.0/toktx-linux-64.zip
#RUN unzip toktx-linux-64.zip -d /usr/local/bin
#RUN chmod +x /usr/local/bin/toktx

RUN apt-get update
RUN apt-get install -y wget

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9003

CMD [ "npm", "start" ]
