#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-FacebookReceiver.git /usr/local/src/facebookreceiver
#RUN cd /usr/local/src/facebookreceiver; npm install
#CMD ["nodejs", "/usr/local/src/facebookreceiver/app.js"]

#EXPOSE 4648

FROM node:9.9.0
ARG VERSION_TAG
RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-FacebookReceiver.git /usr/local/src/facebookreceiver
RUN cd /usr/local/src/facebookreceiver;
WORKDIR /usr/local/src/facebookreceiver
RUN npm install
EXPOSE 4648
CMD [ "node", "/usr/local/src/facebookreceiver/app.js" ]
