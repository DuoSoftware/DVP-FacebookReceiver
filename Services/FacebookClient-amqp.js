var amqp = require('amqp');
var util = require('util');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var request = require('request');
var format = require("stringformat");
var CreateEngagement = require('../Workers/common').CreateEngagement;
var CreateComment = require('../Workers/common').CreateComment;
var CreateTicket = require('../Workers/common').CreateTicket;
var UpdateComment = require('../Workers/common').UpdateComment;
var config = require('config');
var validator = require('validator');
var dust = require('dustjs-linkedin');
var juice = require('juice');
var Template = require('../Model/Template').Template;
var uuid = require('node-uuid');
var SocialConnector = require('dvp-mongomodels/model/SocialConnector').SocialConnector;
var FormData = require('form-data');

//var queueHost = format('amqp://{0}:{1}@{2}:{3}',config.RabbitMQ.user,config.RabbitMQ.password,config.RabbitMQ.ip,config.RabbitMQ.port);
var queueName = config.Host.facebookQueueName;

var rabbitmqIP = [];
if(config.RabbitMQ.ip) {
    rabbitmqIP = config.RabbitMQ.ip.split(",");
}

var queueConnection = amqp.createConnection({
    host: rabbitmqIP,
    port: config.RabbitMQ.port,
    login: config.RabbitMQ.user,
    password: config.RabbitMQ.password,
    vhost: config.RabbitMQ.vhost,
    noDelay: true,
    heartbeat:10
}, {
    reconnect: true,
    reconnectBackoffStrategy: 'linear',
    reconnectExponentialLimit: 120000,
    reconnectBackoffTime: 1000
});

queueConnection.on('ready', function () {
    queueConnection.queue(queueName, {durable: true, autoDelete: false},function (q) {
        q.bind('#');
        q.subscribe({
            ack: true,
            prefetchCount: 10
        }, function (message, headers, deliveryInfo, ack) {

            //message = JSON.parse(message.data.toString());
            console.log(message);
            if (!message || !message.to || !message.from || !message.reply_session ||  !message.body || !message.company || !message.tenant) {
                console.log('FB Client AMQP-Invalid message, skipping');
                return ack.acknowledge();
            }
            ///////////////////////////create body/////////////////////////////////////////////////

            MakeCommentsToWallPost(message.tenant,message.company,message.from,message.reply_session,message.body,message,ack)
        });
    });
});

function MakeCommentsToWallPost(tenant,company,connectorId,objectid,msg,data,ack) {

    console.log("MakeCommentsToWallPost. RMQ Data >  " + JSON.stringify(data));
    SocialConnector.findOne({'_id': connectorId, company: company, tenant: tenant}, function (err, user) {

        if (err) {
            logger.error("Fail To Find Social Connector.",err);
            ack.reject(true);
        }
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token,
                message: msg
            };



            console.log(propertiesObject);

            var options = {
                method: 'post',
                uri: config.Services.facebookUrl + objectid + '/comments',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if(data.attachments && Array.isArray(data.attachments)&& data.attachments.length > 0){

                var fileServiceHost = config.Services.fileServiceHost;
                var fileServicePort = config.Services.fileServicePort;
                var fileServiceVersion = config.Services.fileServiceVersion;

                if(fileServiceHost && fileServicePort && fileServiceVersion) {
                    var httpUrl = util.format('http://%s/DVP/API/%s/InternalFileService/File/Download/%d/%d/%s/%s', fileServiceHost, fileServiceVersion, company, tenant, data.attachments[0], data.attachments[0]);

                    if (validator.isIP(fileServiceHost)) {
                        httpUrl = util.format('http://%s:%s/DVP/API/%s/InternalFileService/File/Download/%d/%d/%s/%s', fileServiceHost, fileServicePort, fileServiceVersion, company, tenant, data.attachments[0], data.attachments[0]);
                    }

                    //var form = new FormData();
                    //form.append('source', request(httpUrl));
                    //
                    //options.formData = form;
                }
            }

            request(options, function (error, response, body) {
                if (error) {
                    logger.error("Fail To Make Comment.",err);
                    ack.acknowledge();
                }
                else {
                    if (response.statusCode == 200) {

                        /*CreateEngagement("facebook-post", company, tenant, fbData.sender_name, to.name, "inbound", fbData.comment_id, fbData.message, user, fbData.sender_id, to, function (isSuccess, engagement) {*/
                        CreateEngagement("facebook-post", company, tenant, data.author, data.to, "outbound", JSON.parse(body).id, data.body, undefined, data.from, data.to, function (isSuccess, engagement) {
                            if (isSuccess) {
                                /*CreateComment('facebook-post', 'Comment', company, tenant, fbData.parent_id, undefined, engagement, function (done) {
                                 if (!done) {
                                 logger.error("Fail To Add Comments" + fbData.post_id);
                                 } else {

                                 logger.info("Facebook Comment Added successfully " + fbData.post_id);
                                 }
                                 })*/

                                UpdateComment(tenant, company, data.comment,engagement._id, function (done) {
                                    if (done) {
                                        logger.info("Update Comment Completed ");

                                    } else {

                                        logger.error("Update Comment Failed ");

                                    }
                                });


                            } else {

                                logger.error("Create engagement failed " + JSON.parse(body).id);

                            }
                        });

                        ack.acknowledge();
                    }
                    else {
                        logger.error("Fail To Make Comment.",new Error("Fail To Make Comment"));
                        ack.acknowledge();
                    }

                    console.log("MakeCommentsToWallPost..... > "+ JSON.stringify(body));
                }
            });


            //var req =


        }
        else {
            logger.error("Fail To Find Connector. >  " + JSON.stringify(data),new Error("Fail To Find Connector"));
            ack.acknowledge();
        }
    });
}

module.exports.MakeCommentsToWallPost = MakeCommentsToWallPost;


