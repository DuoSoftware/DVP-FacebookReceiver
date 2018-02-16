var request = require("request");
var format = require("stringformat");
var validator = require('validator');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

function AddToRequest(company, tenant,session_id, priority, otherInfo, attributes, cb){


    if (config.Services && config.Services.ardsServiceHost && config.Services.ardsServicePort && config.Services.ardsServiceVersion) {

        var url = format("http://{0}/DVP/API/{1}/ARDS/request", config.Services.ardsServiceHost, config.Services.ardsServiceVersion);
        if (validator.isIP(config.Services.ardsServiceHost))
            url = format("http://{0}:{1}/DVP/API/{2}/ARDS/request", config.Services.ardsServiceHost, config.Services.ardsServicePort, config.Services.ardsServiceVersion);


        var data = {

            SessionId: session_id,
            RequestType: "SOCIAL",
            Priority: priority,
            ResourceCount: 1,
            OtherInfo: otherInfo,
            Attributes: attributes,
            RequestServerId: serverID,
            ServerType: serverType

        };


        request({
            method: "POST",
            url: url,
            headers: {
                authorization: "Bearer " + config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: data
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200) {

                    logger.debug("Successfully registered");
                    return cb(true);
                } else {

                    logger.error("Registration Failed "+_error);
                    return cb(false);

                }
            }
            catch (excep) {

                logger.error("Registration Failed "+excep);
                return cb(false);
            }

        });

    }else{
        return cb(false);
    }


};

function CreateComment(channel, channeltype, company, tenant, engid, author, engagement, cb){

    //http://localhost:3636/DVP/API/1.0.0.0/TicketByEngagement/754236638146859008/Comment

    if (config.Services && config.Services.ticketServiceHost && config.Services.ticketServicePort && config.Services.ticketServiceVersion) {

        var url = format("http://{0}/DVP/API/{1}/TicketByEngagement/{2}/Comment", config.Services.ticketServiceHost, config.Services.ticketServiceVersion,engid);
        if (validator.isIP(config.Services.ticketServiceHost))
            url = format("http://{0}:{1}/DVP/API/{2}/TicketByEngagement/{3}/Comment", config.Services.ticketServiceHost, config.Services.ticketServicePort,config.Services.ticketServiceVersion, engid);


        var data = {

            body: engagement.body,
            body_type: "text",
            type: channeltype,
            public: 'public',
            channel: channel,
            author: author,
            channel_from: engagement.channel_from,
            engagement_session: engagement.engagement_id,
            author_external: engagement.profile_id


        };

        request({
            method: "PUT",
            url: url,
            headers: {
                authorization: "Bearer " + config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: data
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200) {

                    logger.debug("Successfully created a comment");
                    return cb(true);
                } else {

                    logger.error("Comment creation Failed "+_error);
                    return cb(false);

                }
            }
            catch (excep) {

                logger.error("Comment creation Failed "+excep);
                return cb(false);
            }

        });

    }else{

        return cb(false);
    }

};

function UpdateComment(tenant, company, cid,eid, cb){

    //http://localhost:3636/DVP/API/1.0.0.0/TicketByEngagement/754236638146859008/Comment
///DVP/API/:version/Ticket/Comment/:id
    if (config.Services && config.Services.ticketServiceHost && config.Services.ticketServicePort && config.Services.ticketServiceVersion) {

        var url = format("http://{0}/DVP/API/{1}/Ticket/Comment/{2}", config.Services.ticketServiceHost, config.Services.ticketServiceVersion,cid);
        if (validator.isIP(config.Services.ticketServiceHost))
            url = format("http://{0}:{1}/DVP/API/{2}/Ticket/Comment/{3}", config.Services.ticketServiceHost, config.Services.ticketServicePort,config.Services.ticketServiceVersion, cid);


        var data = {
            engagement_session: eid
        };


        console.log("UpdateComment . cid : " + cid +" eid : "+eid+" url"+url);
        request({
            method: "PUT",
            url: url,
            headers: {
                authorization: "Bearer " + config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: data
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200) {

                    logger.debug("Successfully updated the comment");
                    return cb(true);
                } else {

                    logger.error("Comment update Failed "+_error);
                    return cb(false);

                }
            }
            catch (excep) {

                logger.error("Comment update Failed "+excep);
                return cb(false);
            }

        });

    }else{

        return cb(false);
    }

};

function CreateEngagement(channel, company, tenant, from, to, direction, session, data, user,channel_id,contact,  cb){

    if((config.Services && config.Services.interactionurl && config.Services.interactionport && config.Services.interactionversion)) {


        var engagementURL = format("http://{0}/DVP/API/{1}/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionversion);
        if (validator.isIP(config.Services.interactionurl))
            engagementURL = format("http://{0}:{1}/DVP/API/{2}/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionport, config.Services.interactionversion);

        var engagementData =  {
            engagement_id: session,
            channel: channel,
            direction: direction,
            channel_from:from,
            channel_to: to,
            body: data,
            user: user,
            channel_id: channel_id,
            raw: contact
        };



        request({
            method: "POST",
            url: engagementURL,
            headers: {
                authorization: "bearer "+config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: engagementData
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200&& _response.body && _response.body.IsSuccess) {

                    return cb(true,_response.body.Result);

                }else{

                    logger.error("There is an error in  create engagements for this session "+ session);
                    return cb(false,{});


                }
            }
            catch (excep) {

                return cb(false,{});
            }
        });
    }else{

        return cb(false,{});
    }
};

function CreateTicket(channel,session,profile, company, tenant, type, subjecct, description, priority, tags, cb){

    if((config.Services && config.Services.ticketServiceHost && config.Services.ticketServicePort && config.Services.ticketServiceVersion)) {


        var ticketURL = format("http://{0}/DVP/API/{1}/Ticket", config.Services.ticketServiceHost, config.Services.ticketServiceVersion);
        if (validator.isIP(config.Services.ticketServiceHost))
            ticketURL = format("http://{0}:{1}/DVP/API/{2}/Ticket", config.Services.ticketServiceHost, config.Services.ticketServicePort, config.Services.ticketServiceVersion);

        var ticketData =  {

            "type": type,
            "subject": subjecct,
            "reference": session,
            "description": description,
            "priority": priority,
            "status": "new",
            "requester":profile,
            "engagement_session": session,
            "channel": channel,
            "tags": tags,
        };

        request({
            method: "POST",
            url: ticketURL,
            headers: {
                authorization: "bearer "+config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: ticketData
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200 && _response.body && _response.body.IsSuccess) {

                    return cb(true, _response.body.reference);

                }else{

                    logger.error("There is an error in  create ticket for this session "+ session);

                    return cb(false, "");


                }
            }
            catch (excep) {

                return cb(false, "");

            }
        });
    }else{

        return cb(false, "");
    }
}

function RegisterCronJob(company, tenant, time, id,mainServer, cb){

    if((config.Services && config.Services.cronurl && config.Services.cronport && config.Services.cronversion)) {


        var cronURL = format("http://{0}/DVP/API/{1}/Cron", config.Services.cronurl, config.Services.cronversion);
        if (validator.isIP(config.Services.cronurl))
            cronURL = format("http://{0}:{1}/DVP/API/{2}/Cron", config.Services.cronurl, config.Services.cronport, config.Services.cronversion);

        var engagementData =  {

            Reference: id,
            Description: "Direct message twitter",
            CronePattern: format( "*/{0} * * * *",time),
            CallbackURL: mainServer,
            CallbackData: ""

        };

        logger.debug("Calling cron registration service URL %s", cronURL);
        request({
            method: "POST",
            url: cronURL,
            headers: {
                authorization: "bearer "+config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            },
            json: engagementData
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200&& _response.body && _response.body.IsSuccess) {

                    return cb(true,_response.body.Result);

                }else{

                    logger.error("There is an error in  cron registration for this");
                    return cb(false,{});


                }
            }
            catch (excep) {

                return cb(false,{});

            }
        });
    }else{

        return cb(false,{});
    }

}

function StartStopCronJob(company, tenant, id,action,cb){

    if((config.Services && config.Services.cronurl && config.Services.cronport && config.Services.cronversion)) {


        var cronURL = format("http://{0}/DVP/API/{1}/Cron/Reference/{2}/Action/{3}", config.Services.cronurl, config.Services.cronversion,id,action);
        if (validator.isIP(config.Services.cronurl))
            cronURL = format("http://{0}:{1}/DVP/API/{2}/Cron/Reference/{3}/Action/{4}", config.Services.cronurl, config.Services.cronport, config.Services.cronversion,id,action);

       /* var engagementData =  {

            Reference: id,
            Description: "Direct message twitter",
            CronePattern: format( "*!/{0} * * * *",time),
            CallbackURL: mainServer,
            CallbackData: ""

        };*/

        logger.debug("StopCronJob service URL %s", cronURL);
        request({
            method: "POST",
            url: cronURL,
            headers: {
                authorization: "bearer "+config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            }
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200&& _response.body && _response.body.IsSuccess) {

                    return cb(true,_response.body.Result);

                }else{

                    logger.error("There is an error in  StopCronJob for this");
                    return cb(false,{});


                }
            }
            catch (excep) {

                return cb(false,{});

            }
        });
    }else{

        return cb(false,{});
    }

}

function GetCallRule(company, tenant, ani, dnis, category,cb){

    //http://ruleservice.app.veery.cloud/DVP/API/1.0.0.0/CallRuleApi/CallRule/Outbound/ANI/234/DNIS/3324323432/Category/SMS

    if((config.Services && config.Services.ruleserviceurl && config.Services.ruleserviceport && config.Services.ruleserviceversion)) {


        var callURL = format("http://{0}/DVP/API/{1}/CallRuleApi/CallRule/Outbound/ANI/{2}/DNIS/{3}/Category/{4}", config.Services.cronurl, config.Services.cronversion,ani, dnis,category);
        if (validator.isIP(config.Services.cronurl))
            callURL = format("http://{0}:{1}/DVP/API/{2}/CallRuleApi/CallRule/Outbound/ANI/{2}/DNIS/{3}/Category/{4}", config.Services.cronurl, config.Services.cronport, config.Services.cronversion,ani, dnis,category);

        /* var engagementData =  {

         Reference: id,
         Description: "Direct message twitter",
         CronePattern: format( "*!/{0} * * * *",time),
         CallbackURL: mainServer,
         CallbackData: ""

         };*/

        logger.debug("SMS rule service URL %s", cronURL);
        request({
            method: "GET",
            url: callURL,
            headers: {
                authorization: "bearer "+config.Services.accessToken,
                companyinfo: format("{0}:{1}", tenant, company)
            }
        }, function (_error, _response, datax) {

            try {

                if (!_error && _response && _response.statusCode == 200&& _response.body && _response.body.IsSuccess) {

                    return cb(true,_response.body.Result);

                }else{

                    logger.error("There is an error in  StopCronJob for this");
                    return cb(false,{});


                }
            }
            catch (excep) {

                return cb(false,{});

            }
        });
    }else{

        return cb(false,{});
    }


}


module.exports.AddToRequest = AddToRequest;
module.exports.CreateComment = CreateComment;
module.exports.CreateEngagement = CreateEngagement;
module.exports.CreateTicket = CreateTicket;
module.exports.RegisterCronJob = RegisterCronJob;
module.exports.UpdateComment = UpdateComment;
module.exports.StartStopCronJob = StartStopCronJob;
module.exports.GetCallRule = GetCallRule;


