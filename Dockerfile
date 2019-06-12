FROM node:10-alpine

RUN apk update && apk add shadow git

RUN useradd -ms /bin/bash omg

USER omg

COPY . /home/omg/

WORKDIR /home/omg/

RUN cd /home/omg/ && npm install

ENTRYPOINT ["npm", "run", "start"]
