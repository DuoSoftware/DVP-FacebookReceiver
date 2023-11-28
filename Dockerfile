#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-FacebookReceiver.git /usr/local/src/facebookreceiver
#RUN cd /usr/local/src/facebookreceiver; npm install
#CMD ["nodejs", "/usr/local/src/facebookreceiver/app.js"]

#EXPOSE 4648

FROM node:10-alpine
WORKDIR /usr/local/src/facebookreceiver
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4648
CMD [ "node", "app.js" ]
