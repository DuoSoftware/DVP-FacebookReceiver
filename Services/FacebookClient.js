/**
 * Created by Rajinda on 7/18/2016.
 */

var request = require("request");
var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var SocialConnector = require('dvp-mongomodels/model/SocialConnector').SocialConnector;
var async = require("async");
var moment = require('moment');
var config = require('config');
var CreateTicket = require('../Workers/common').CreateTicket;
var AddToRequest = require('../Workers/common').AddToRequest;
var CreateComment = require('../Workers/common').CreateComment;
var CreateEngagement = require('../Workers/common').CreateEngagement;
/*var CreateTicket = require('../Workers/common').CreateTicket;*/
var RegisterCronJob = require('../Workers/common').RegisterCronJob;
var validator = require('validator');
var format = require("stringformat");
var util = require('util');
/*var authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkdW9vd25lciIsImp0aSI6IjI1NmZhMjNiLTQ3YTAtNDU0NS05ZGYxLTAxMWIwZDdjYWViOSIsInN1YiI6IkFjY2VzcyBjbGllbnQiLCJleHAiOjIwNjg1ODA5MjIsInRlbmFudCI6MSwiY29tcGFueSI6MTAzLCJhdWQiOiJteWFwcCIsImNvbnRleHQiOnt9LCJzY29wZSI6W3sicmVzb3VyY2UiOiJ0aWNrZXQiLCJhY3Rpb25zIjpbInJlYWQiLCJ3cml0ZSIsImRlbGV0ZSJdfSx7InJlc291cmNlIjoic2xhIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX0seyJyZXNvdXJjZSI6InRyaWdnZXJzIiwiYWN0aW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXX1dLCJpYXQiOjE0Njc5NzYxMjJ9.05YMBXY5PgTJZpY6qJA0YVgeXtND0aMiCU85fvOvDJc";*/
var authorization;

var mongoip = config.Mongo.ip;
var mongoport = config.Mongo.port;
var mongodb = config.Mongo.dbname;
var mongouser = config.Mongo.user;
var mongopass = config.Mongo.password;
var mongoreplicaset=config.Mongo.replicaset;


var mongoose = require('mongoose');
var connectionstring = '';
mongoip = mongoip.split(',');
if(util.isArray(mongoip)){
 if(mongoip.length > 1){    
    mongoip.forEach(function(item){
        connectionstring += util.format('%s:%d,',item,mongoport)
    });

    connectionstring = connectionstring.substring(0, connectionstring.length - 1);
    connectionstring = util.format('mongodb://%s:%s@%s/%s',mongouser,mongopass,connectionstring,mongodb);

    if(mongoreplicaset){
        connectionstring = util.format('%s?replicaSet=%s',connectionstring,mongoreplicaset) ;
        logger.info("connectionstring ...   "+connectionstring);
    }
 }
    else
    {
        connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip[0],mongoport,mongodb);
    }
}else {

    connectionstring = util.format('mongodb://%s:%s@%s:%d/%s', mongouser, mongopass, mongoip, mongoport, mongodb);

}
logger.info("connectionstring ...   "+connectionstring);

mongoose.connection.on('error', function (err) {
    logger.error(err);
});

mongoose.connection.on('disconnected', function () {
    logger.error('Could not connect to database');
});

mongoose.connection.once('open', function () {
    logger.info("Connected to db");
});


mongoose.connect(connectionstring);


module.exports.GetFacebookAccounts = function (req, res) {
    logger.info("DVP-SocialConnector.GetFacebookAccounts Internal method ");

    var companyId = parseInt(req.user.company);
    var tenantId = parseInt(req.user.tenant);
    SocialConnector.find({company: companyId, tenant: tenantId}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            jsonString = messageFormatter.FormatMessage(undefined, "Account List.", true, user);
            res.end(jsonString);
        }
        else {
            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Get Account List.", false, user);
            res.end(jsonString);
        }

    });
};

module.exports.CreateFacebookAccount = function (req, res) {
    logger.info("DVP-SocialConnector.CreateFacebookAccount Internal method ");

    var profile = req.body;
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': profile.id}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Connector Setting. All ready Added.", false, user);
            res.end(jsonString);
        }
        else {
            generateLongLivedToken(profile.fb.access_token, function (err, body) {
                if (err) {
                    res.end(jsonString);
                }
                else {

                    generatePageAccessToken(JSON.parse(body).access_token,profile.fb.pageID,function (err, data) {

                        logger.info(data);

                        if(JSON.parse(data) && JSON.parse(data).access_token) {

                            var page_access_token = JSON.parse(data).access_token;

                            subscribePageToApp(JSON.parse(data).access_token, profile.fb.pageID, function (err, data) {
                                logger.info(data);

                                var newUser = new SocialConnector();

                                // set all of the facebook information in our user model
                                newUser._id = profile.id; // set the users facebook id
                                newUser.fb = {};
                                newUser.fb.status = true;
                                newUser.fb.access_token = page_access_token;
                                    //JSON.parse(body).access_token; // we will save the token that facebook provides to the user
                                newUser.fb.firstName = profile.fb.firstName;
                                newUser.fb.lastName = profile.fb.lastName; // look at the passport user profile to see how names are returned
                                newUser.fb.email = profile.fb.email ? profile.fb.email : "noemail@facetone.com"; // facebook can return multiple emails so we'll take the first
                                newUser.fb.clientID = config.SocialConnector.fb_client_id;
                                newUser.fb.clientSecret = config.SocialConnector.fb_client_secret;
                                newUser.company = company;
                                newUser.tenant = tenant;
                                newUser.fb.lastUpdate = moment().unix();
                                newUser.fb.pageID = profile.fb.pageID;
                                newUser.fb.pagePicture = profile.fb.pagePicture;
                                newUser.fb.ticketToPost = true;
                                newUser.fb.profileID = profile.profileID;
                                newUser.fb.profileName = profile.profileName;
                                // save our user to the database
                                newUser.save(function (err, obj) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                                        res.end(jsonString);
                                    }
                                    else {

                                        jsonString = messageFormatter.FormatMessage(undefined, "Facebook Saved Successfully", true, obj);
                                        res.end(jsonString);
                                    }
                                });

                            });


                        }else{

                            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                            res.end(jsonString);
                        }
                    });


                    // if there is no user found with that facebook id, create them

                }

            })
        }

    });
};

module.exports.DeleteFacebookAccount = function (req, res) {
    logger.info("DVP-SocialConnector.CreateFacebookAccount Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': req.params.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {


            unSubscribePageToApp(user.fb.access_token,user.fb.pageID,function(error,data){

                if(error){

                    console.error("Unsubscribed to page is failed",error);
                }else{
                    console.error("unsubscribe frompage successfully..... ");
                }

                user.update({
                    "$set": {
                        "fb.status": false,
                        "updated_at": Date.now()
                    }
                }, function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        // if successful, return the new user
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully Removed.", true, undefined);
                        res.end(jsonString);
                    }
                });

            });

        }
        else {
            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Connector.", false, user);
            res.end(jsonString);
        }

    });
};

module.exports.ActiveteFacebookAccount = function (req, res) {
    logger.info("DVP-SocialConnector.ActiveFacebookAccount Internal method ");
    var profile = req.body;
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': req.params.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user && user.fb) {


            subscribePageToApp(user.fb.access_token, user.fb.pageID, function (err, data) {


                user.update({
                    "$set": {
                        "fb.status": true,
                        //"fb.access_token": tok,
                        "updated_at": Date.now()
                    }
                }, function (err) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        // if successful, return the new user
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully Activated.", true, undefined);
                        res.end(jsonString);
                    }
                });
            });


            //generateLongLivedToken(user.fb.access_token, function (err, body) {
            //    if (err) {
            //        res.end(jsonString);
            //    }
            //    else {
            //        var tok = JSON.parse(body).access_token;
            //
            //
            //        generatePageAccessToken(JSON.parse(body).access_token,user.fb.pageID,function (err, data) {
            //
            //            logger.info(data);
            //
            //            if (JSON.parse(data) && JSON.parse(data).access_token) {
            //
            //                var page_access_token = JSON.parse(data).access_token;
            //
            //                subscribePageToApp(JSON.parse(data).access_token, user.fb.pageID, function (err, data) {
            //
            //
            //                    user.update({
            //                        "$set": {
            //                            "fb.status": true,
            //                            "fb.access_token": tok,
            //                            "updated_at": Date.now()
            //                        }
            //                    }, function (err) {
            //                        if (err) {
            //                            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            //                            res.end(jsonString);
            //                        }
            //                        else {
            //                            // if successful, return the new user
            //                            jsonString = messageFormatter.FormatMessage(undefined, "Successfully Activated.", true, undefined);
            //                            res.end(jsonString);
            //                        }
            //                    });
            //                });
            //            }else{
            //
            //                jsonString = messageFormatter.FormatMessage(err, "Access token generation failed", false, undefined);
            //                res.end(jsonString);
            //            }
            //        });
            //    }
            //});


        }
        else {
            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Connector.", false, user);
            res.end(jsonString);
        }

    });
};

module.exports.UpdatePagePicture = function (req, res) {
    logger.info("DVP-SocialConnector.UpdatePagePicture Internal method ");
    var profile = req.body;
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': req.params.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        if (user) {
            user.update({
                "$set": {
                    "fb.pagePicture": profile.picture,
                    "updated_at": Date.now()
                }
            }, function (err) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {
                    // if successful, return the new user
                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Updated.", true, undefined);
                    res.end(jsonString);
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Connector.", false, user);
            res.end(jsonString);
        }

    });
};

module.exports.PostToWall = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': req.params.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token,
                message: req.body.message
            };
            var options = {
                method: 'POST',
                uri: config.Services.facebookUrl + 'me/feed',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully Post.", true, body);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Post.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.RemoveItem = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': profile.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token
            };
            var options = {
                method: 'DELETE',
                uri: config.Services.facebookUrl + req.params.itemid,
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully Delete.", true, body);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Delete.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.MakeCommentsToWallPost = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': profile.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token,
                message: req.body.message
            };
            var options = {
                method: 'post',
                uri: config.Services.facebookUrl + req.params.objectid + '/comments',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Comment Successfully.", true, body);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Make Comment.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.GetTopLevelComments = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': profile.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token,
                filter: 'toplevel'
            };
            var options = {
                method: 'get',
                uri: config.Services.facebookUrl + req.params.objectid + '/comments',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully.", true, body);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Get Top Level Comments.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.GetComments = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': profile.id, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.access_token,
                filter: 'stream',
                order: 'reverse_chronological'
            };
            var options = {
                method: 'get',
                uri: config.Services.facebookUrl + req.params.objectid + '/comments',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Successfully.", true, body);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Get Comments.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.GetFbPostList = function (req, res) {
    logger.info("DVP-SocialConnector.GetFbPostList Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    SocialConnector.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, fbConnector) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Social Connector Settings.", false, undefined);
            res.end(jsonString);

        }
        else {
            if (fbConnector) {
                var propertiesObject = {
                    access_token: fbConnector.fb.access_token,
                    fields: 'id,message,from,to,created_time,comments',
                    since: fbConnector.fb.lastUpdate
                };
                var options = {
                    method: 'GET',
                    uri: config.Services.facebookUrl + fbConnector.fb.pageID + '/feed',
                    qs: propertiesObject,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                };

                request(options, function (error, response, body) {

                    if (response.statusCode == 200) {

                        var updateT = moment().unix();
                        fbConnector.update({
                            "$set": {
                                "fb.lastUpdate": updateT
                            }
                        }, function (err, obf) {
                            console.info("Update .....");
                        });

                        var jsonResp = {};
                        if (response.statusCode == 200) {
                            jsonResp = JSON.parse(body);
                            jsonResp.fbConnector = fbConnector.toJSON();
                            jsonResp.statusCode = response.statusCode;
                            var data = [];
                            data.push(jsonResp);

                            jsonString = messageFormatter.FormatMessage(undefined, "EXCEPTION", true, "Process Start");
                            if (jsonResp.data.length == 0)
                                jsonString = messageFormatter.FormatMessage(undefined, "EXCEPTION", true, "No New Post.");
                            res.end(jsonString);
                            processFacebookWallData(data);

                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "EXCEPTION", true, "Fail To Start Process.");
                            res.end(jsonString);
                        }
                    }

                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Social Connector Settings.", false, undefined);
                res.end(jsonString);
            }

        }
    });
};

module.exports.GetFbsPostList = function (req, res) {
    logger.info("DVP-SocialConnector.GetFbPostList Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    SocialConnector.find({company: company, tenant: tenant}, function (err, fbConnectors) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Social Connector Settings.", false, undefined);
            res.end(jsonString);

        } else {

            if (fbConnectors.length > 0) {

                // Array to hold async tasks
                var asyncTasks = [];
                fbConnectors.forEach(function (item) {

                    asyncTasks.push(function (callback) {
                        var propertiesObject = {
                            access_token: item.fb.access_token,
                            fields: 'id,message,from,to,created_time,comments',
                            since: item.fb.lastUpdate
                        };
                        var options = {
                            method: 'GET',
                            uri: config.Services.facebookUrl + item.fb.pageID + '/feed',
                            qs: propertiesObject,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        };

                        request(options, function (error, response, body) {

                            var jsonResp = {};
                            if (error) {
                                jsonResp.error = error;
                            }
                            else if (response.statusCode != 200 || error) {
                                jsonResp.error = response.body;
                            }
                            else {
                                error = undefined;
                                jsonResp = JSON.parse(body);
                                jsonResp.fbConnector = item.toJSON();
                                jsonResp.statusCode = response.statusCode;
                            }
                            callback(error, jsonResp);
                            var updateT = moment().unix();
                            item.update({
                                "$set": {
                                    "fb.lastUpdate": updateT
                                }
                            }, function (err, obf) {
                                console.info("Update .....");
                            });
                        });

                    });
                });
                async.parallel(asyncTasks,
                    function (err, results) {
                        if (!err) {
                            if (results.length > 0) {
                                jsonString = messageFormatter.FormatMessage(undefined, "EXCEPTION", true, "Process Start.123");
                            }
                            else {
                                jsonString = messageFormatter.FormatMessage(undefined, "EXCEPTION", true, "No New Post.");
                            }

                            res.end(jsonString);
                            // process data and create ticket
                            processFacebookWallData(results);
                        }
                    });


            } else {

                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Social Connector Settings.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.SubscribeToPage = function (req, res) {

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    SocialConnector.findOne({'_id': req.params.pageId, company: company, tenant: tenant}, function (err, user) {

        var jsonString;
        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
            res.end(jsonString);
        }

        // if the user is found, then log them in
        if (user) {
            var propertiesObject = {
                access_token: user.fb.clientID + "|" + user.fb.clientSecret,
                fields: 'category,conversations,feed,messages',
                object: 'page',
                callback_url: req.body.url,
                verify_token: req.params.verify_token
            };
            var options = {
                method: 'POST',
                uri: config.Services.facebookUrl + req.params.pageId + '/subscriptions',
                qs: propertiesObject,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };


            request(options, function (error, response, body) {
                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {

                        user.update({
                            "$set": {
                                "subscribe": true
                            }
                        }, function (err, rUser) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Successfully Subscribe To Page but Fail To Update Social Connector Setting.", false, undefined);
                            }
                            else {
                                if (rUser) {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Subscribe To Page.", true, body);
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Subscribe To Page but Fail To Update Social Connector Setting.", false, undefined);
                                }
                            }
                            res.end(jsonString);
                        });

                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(body, "Fail To Subscribe.", false, undefined);
                        res.end(jsonString);
                    }
                }
            });
        }
        else {
            jsonString = messageFormatter.FormatMessage(new Error("Fail To Find Configuration Setting."), "Fail To Find Configuration Setting.", false, undefined);
            res.end(jsonString);
        }
    });

};

module.exports.RealTimeUpdates = function (fbData) {
    fbData.entry.forEach(function (items) {

        console.log(items);

        var ownerIds = config.SocialConnector.owner_id.split(",");

        items.changes.forEach(function (change) {
            /*if (change.value.sender_id.toString() === config.SocialConnector.owner_id){*/
                if (ownerIds.indexOf(change.value.from.id.toString()) === -1) {
                    if (change.field == "feed") {
                        if (change.value.item == "status" || change.value.item == "post") {
                            // create ticket
                            RealTimeCreateTicket(items.id, change.value);
                        }
                        else if (change.value.item == "comment") {
                            // add comment
                            RealTimeComments(items.id, change.value);
                        }
                    }

                }
                else {
                    console.log("Comment By Owner....................................");
                }

        });
    });
};

var RealTimeComments = function (id, fbData) {

    var jsonString;
    SocialConnector.findOne({_id: id}, function (err, fbConnector) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Social Connector Settings.", false, undefined);
            logger.error(jsonString);
        }
        else {
            if (fbConnector) {
                var company = parseInt(fbConnector.company);
                var tenant = parseInt(fbConnector.tenant);


                var to = {
                    "id": id,
                    "name": fbData.firstName + " " + fbData.lastName
                };

                var user = {};
                user.name = fbData.sender_name;
                user.id = fbData.sender_id;
                user.channel = 'facebook';

                console.log("CreateEngagement");
                CreateEngagement("facebook-post", company, tenant, fbData.sender_name, to.name, "inbound", fbData.comment_id, fbData.message, user, fbData.sender_id, to, function (isSuccess, engagement) {
                    console.log("CreateEngagement ......" +isSuccess);
                    if (isSuccess) {
                        console.log("CreateEngagement-------------- " + JSON.stringify(fbData));
                        CreateComment('facebook-post', 'Comment', company, tenant, fbData.parent_id, undefined, engagement, function (done) {
                            console.log("CreateComment ......" +done);
                            if (!done) {
                                logger.error("Fail To Add Comments" + JSON.stringify(fbData));
                            } else {

                                logger.info("Facebook Comment Added successfully " + fbData.parent_id);
                            }

                        })

                    } else {

                        logger.error("Create engagement failed " + fbData.post_id);

                    }
                })
            }
        }
    });


};

var RealTimeCreateTicket = function (id, fbData) {


    var jsonString;
    SocialConnector.findOne({_id: id}, function (err, fbConnector) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Social Connector Settings.", false, undefined);
            logger.error(jsonString);
        }
        else {
            if (fbConnector) {

                var company = parseInt(fbConnector.company);
                var tenant = parseInt(fbConnector.tenant);

                var from = {
                    "name": fbData.sender_name,
                    "id": fbData.sender_id
                };

                var name = fbConnector.fb.firstName + " " + fbConnector.fb.lastName;
                var to = {
                    "id": id,
                    "name": name
                };

                var user = {};
                user.name = fbData.sender_name;
                user.id = fbData.sender_id;
                user.channel = 'facebook';

                CreateEngagement("facebook-post", company, tenant, fbData.sender_name, to.name, "inbound", fbData.post_id, fbData.message, user, fbData.sender_id, to, function (isSuccess, engagement) {

                    if (isSuccess) {

                        //CreateTicket(channel,session,profile, company, tenant, type, subjecct, description, priority, tags, cb)
                        CreateTicket("facebook-post", engagement.engagement_id, engagement.profile_id, company, tenant, "question", "Facebook Wall Post ", fbData.message, "normal", ["facebook.post.common.common"], function (done) {
                            if (done) {
                                logger.info("Facebook Ticket Added successfully " + fbData.post_id);

                            } else {

                                logger.error("Create Ticket failed " + fbData.post_id);
                            }
                        });

                        /*

                         var ticketData = {
                         "type": "question",
                         "subject": "Facebook Wall Post",
                         "reference": fbData.id,
                         "description": fbData.message,
                         "priority": "normal",
                         "status": "new",
                         "requester": fbData.sender_id,
                         "engagement_session": engagement.engagement_id,
                         "channel": JSON.stringify(from),
                         "tags": ["facebook.post.common.common",name]


                         };

                         var ticketUrl = format("http://{0}/DVP/API/{1}/Ticket", config.Services.ticketServiceHost, config.Services.ticketServiceVersion);


                         var options = {
                         method: 'POST',
                         uri: ticketUrl,
                         headers: {
                         Accept: 'application/json',
                         authorization: "Bearer " + config.Services.accessToken,
                         companyinfo: format("{0}:{1}", tenant, company)
                         },
                         json: ticketData
                         };

                         request(options, function (error, response, body) {

                         console.log(response);
                         if (response.statusCode == 200) {
                         if(body.IsSuccess)
                         jsonString = messageFormatter.FormatMessage(undefined, "Ticket Create Successfully.", true, undefined);
                         else{
                         jsonString = messageFormatter.FormatMessage(body.Exception, "Fail To Create Ticket.", false, undefined);
                         }
                         }
                         else {
                         jsonString = messageFormatter.FormatMessage(body, "Fail To Create Ticket.", false, undefined);
                         }

                         logger.info("FB Real  Rime Updates: " + jsonString);
                         });
                         */
                    }
                    else {
                        logger.error("Create engagement failed " + id);
                    }
                });
            }
        }
    });
};

var processFacebookWallData = function (fbData) {

    if (fbData) {
        var createTicketTasks = [];
        fbData.forEach(function (item) {
            if (!item.error) {
                if (item.data) {
                    item.data.forEach(function (wallpost) {
                        createTicketTasks.push(function (callback) {
                            CreateEngagement("facebook-post", item.fbConnector.company, item.fbConnector.tenant, wallpost.from.id, JSON.stringify(wallpost.to), "inbound", wallpost.id, wallpost.message, undefined, undefined, function (isSuccess, engagement) {

                                if (isSuccess) {

                                    /*Create Tickets*/
                                    var ticketData = {
                                        "type": "question",
                                        "subject": "Facebook Wall Post",
                                        "reference": wallpost.id,
                                        "description": wallpost.message,
                                        "priority": "normal",
                                        "status": "new",
                                        "requester": wallpost.from.id,
                                        "engagement_session": engagement.engagement_id,
                                        "channel": JSON.stringify(wallpost.from),
                                        "tags": ["complain.product.tv.display"],
                                        "custom_fields": [{"field": "123", "value": "12"}],
                                        "fbComments": wallpost.comments ? wallpost.comments.data : undefined
                                    };
                                    /*var ticketUrl = "http://localhost:3636/DVP/API/1.0/Ticket/Comments";*/
                                    var ticketUrl = format("http://{0}/DVP/API/{1}/Ticket/Comments", config.Services.ticketServiceHost, config.Services.ticketServiceVersion);

                                    var options = {
                                        method: 'POST',
                                        uri: ticketUrl,
                                        headers: {
                                            Accept: 'application/json',
                                            authorization: "Bearer " + config.Services.accessToken,
                                            companyinfo: format("{0}:{1}", item.fbConnector.tenant, item.fbConnector.company)
                                        },
                                        json: ticketData
                                    };

                                    request(options, function (error, response, body) {
                                        callback(error, response);
                                    });

                                    /*Create Tickets*/
                                }
                                else {
                                    logger.error("Create engagement failed " + wallpost.id);
                                }
                            });
                        });
                    });
                }
            }


        });

        if (createTicketTasks.length > 0) {
            async.parallel(createTicketTasks,
                function (err, results) {
                    if (!err) {
                        console.info("create Ticket", results);
                    } else {
                        console.error("create Ticket error", error);
                    }
                });
        }

    }

};

var generateLongLivedToken = function (token, callBack) {
    try {
        var propertiesObject = {
            grant_type: "fb_exchange_token",
            client_id: config.SocialConnector.fb_client_id,
            client_secret: config.SocialConnector.fb_client_secret,
            fb_exchange_token: token
        };
        var options = {
            method: 'GET',
            uri: config.Services.facebookUrl + 'oauth/access_token',
            qs: propertiesObject,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        var jsonString;
        request(options, function (error, response, body) {
            if (error) {
                jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                logger.error("Fail to get  Long Lived Token : " + jsonString);
                callBack(error, undefined);
            }
            else {

                if (response.statusCode == 200) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Post.", true, undefined);
                    logger.error("Get  Long Lived Token :" + jsonString);
                    callBack(undefined, body);
                }
                else {
                    jsonString = messageFormatter.FormatMessage(body, "Fail To Post.", false, undefined);
                    logger.error("Fail to get  Long Lived Token : " + jsonString);
                    callBack(new Error(jsonString), undefined);
                }
            }
        });
    }
    catch (ex) {
        logger.error("Create engagement failed " + id);
        callBack(ex, undefined);
    }

};



var generatePageAccessToken = function (token,pageid, callBack) {
    try {
        var propertiesObject = {

            fields: "access_token",
            access_token: token

        };
        var options = {
            method: 'GET',
            uri: config.Services.facebookUrl + pageid,
            qs: propertiesObject
        };

        var jsonString;
        request(options, function (error, response, body) {
            if (error) {
                jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                logger.error("Fail to get  Long Lived Token : " + jsonString);
                callBack(error, undefined);
            }
            else {

                if (response.statusCode == 200) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Post.", true, undefined);
                    logger.error("Get  Long Lived Token :" + jsonString);
                    callBack(undefined, body);
                }
                else {
                    jsonString = messageFormatter.FormatMessage(body, "Fail To Post.", false, undefined);
                    logger.error("Fail to get  Long Lived Token : " + jsonString);
                    callBack(new Error(jsonString), undefined);
                }
            }
        });
    }
    catch (ex) {
        logger.error("Create engagement failed " + id);
        callBack(ex, undefined);
    }

};


var subscribePageToApp = function (token,pageid, callBack) {
    try {
        var propertiesObject = {

            access_token: token

        };
        var options = {
            method: 'POST',
            uri: config.Services.facebookUrl + pageid+"/subscribed_apps",
            qs: propertiesObject
            //,
            //headers: {
            //    'Content-Type': 'application/json',
            //    'Accept': 'application/json'
            //}
        };

        var jsonString;
        request(options, function (error, response, body) {
            if (error) {
                jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                logger.error("Fail to get  Long Lived Token : " + jsonString);
                callBack(error, undefined);
            }
            else {

                if (response.statusCode == 200) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Post.", true, undefined);
                    logger.error("Get  Long Lived Token :" + jsonString);
                    callBack(undefined, body);
                }
                else {
                    jsonString = messageFormatter.FormatMessage(body, "Fail To Post.", false, undefined);
                    logger.error("Fail to get  Long Lived Token : " + jsonString);
                    callBack(new Error(jsonString), undefined);
                }
            }
        });
    }
    catch (ex) {
        logger.error("Create engagement failed " + id);
        callBack(ex, undefined);
    }

};


var unSubscribePageToApp = function (token,pageid, callBack) {
    try {
        var propertiesObject = {

            access_token: token

        };
        var options = {
            method: 'DELETE',
            uri: config.Services.facebookUrl + pageid+"/subscribed_apps",
            qs: propertiesObject
            //,
            //headers: {
            //    'Content-Type': 'application/json',
            //    'Accept': 'application/json'
            //}
        };

        var jsonString;
        request(options, function (error, response, body) {
            if (error) {
                jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
                logger.error("Fail to get  Long Lived Token : " + jsonString);
                callBack(error, undefined);
            }
            else {

                if (response.statusCode == 200) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Successfully Post.", true, undefined);
                    logger.error("Get  Long Lived Token :" + jsonString);
                    callBack(undefined, body);
                }
                else {
                    jsonString = messageFormatter.FormatMessage(body, "Fail To Post.", false, undefined);
                    logger.error("Fail to get  Long Lived Token : " + jsonString);
                    callBack(new Error(jsonString), undefined);
                }
            }
        });
    }
    catch (ex) {
        logger.error("Create engagement failed " + id);
        callBack(ex, undefined);
    }

};




/*function RegisterCronJob(company, tenant, time, id, cb) {

 if ((config.Services && config.Services.cronurl && config.Services.cronport && config.Services.cronversion)) {


 var cronURL = format("http://{0}/DVP/API/{1}/Cron", config.Services.cronurl, config.Services.cronversion);
 if (validator.isIP(config.Services.cronurl))
 cronURL = format("http://{0}:{1}/DVP/API/{2}/Cron", config.Services.cronurl, config.Services.cronport, config.Services.cronversion);


 var mainServer = format("http://{0}/DVP/API/{1}/Social/Twitter/{2}/directmessages", config.LBServer.ip, config.Host.version, id);

 if (validator.isIP(config.LBServer.ip))
 mainServer = format("http://{0}:{1}/DVP/API/{2}/Social/Twitter/{3}/directmessages", config.LBServer.ip, config.LBServer.port, config.Host.version, id);


 var engagementData = {

 Reference: id,
 Description: "Direct message twitter",
 CronePattern: format("*!/{0} * * * * *", time),
 CallbackURL: mainServer,
 CallbackData: ""

 };

 logger.debug("Calling cron registration service URL %s", cronURL);
 request({
 method: "POST",
 url: cronURL,
 headers: {
 authorization: "bearer " + token,
 companyinfo: format("{0}:{1}", tenant, company)
 },
 json: engagementData
 }, function (_error, _response, datax) {

 try {

 if (!_error && _response && _response.statusCode == 200, _response.body && _response.body.IsSuccess) {

 cb(true, _response.body.Result);

 } else {

 logger.error("There is an error in  cron registration for this");
 cb(false, {});


 }
 }
 catch (excep) {

 cb(false, {});

 }
 });
 }

 };

 function CreateComment(company, tenant, engid, engagement, cb) {

 //http://localhost:3636/DVP/API/1.0.0.0/TicketByEngagement/754236638146859008/Comment

 if (config.Services && config.Services.ticketServiceHost && config.Services.ticketServicePort && config.Services.ticketServiceVersion) {

 var url = format("http://{0}/DVP/API/{1}/TicketByEngagement/{2}/Comment", config.Services.ticketServiceHost, config.Services.ticketServiceVersion, engagement._id);
 if (validator.isIP(config.Services.ticketServiceHost))
 url = format("http://{0}:{1}/DVP/API/{2}/TicketByEngagement/{3}/Comment", config.Services.ticketServiceHost, config.Services.ticketServicePort, config.Services.ticketServiceVersion, engid);


 var data = {

 body: engagement.body,
 body_type: "text",
 type: "twitter mesage",
 public: true,
 channel: "twitter",
 channel_from: engagement.channel_from,
 engagement_session: engagement.engagement_id,
 author_external: engagement.profile_id


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
 cb(true);
 } else {

 logger.error("Registration Failed " + _error);
 cb(false);

 }
 }
 catch (excep) {

 logger.error("Registration Failed " + excep);
 cb(false);
 }

 });

 }

 }

 function CreateEngagement(channel, company, tenant, from, to, direction, session, data, cb) {

 if ((config.Services && config.Services.interactionurl && config.Services.interactionport && config.Services.interactionversion)) {


 var engagementURL = format("http://{0}/DVP/API/{1}/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionversion);
 if (validator.isIP(config.Services.interactionurl))
 engagementURL = format("http://{0}:{1}/DVP/API/{2}/EngagementSessionForProfile", config.Services.interactionurl, config.Services.interactionport, config.Services.interactionversion);

 var engagementData = {
 engagement_id: session,
 channel: channel,
 direction: direction,
 channel_from: from,
 channel_to: to,
 body: data
 };

 logger.debug("Calling Engagement service URL %s", engagementURL);
 request({
 method: "POST",
 url: engagementURL,
 headers: {
 authorization: "bearer " + token,
 companyinfo: format("{0}:{1}", tenant, company)
 },
 json: engagementData
 }, function (_error, _response, datax) {

 try {

 if (!_error && _response && _response.statusCode == 200, _response.body && _response.body.IsSuccess) {

 cb(true, _response.body.Result);

 } else {

 logger.error("There is an error in  create engagements for this session " + session);
 cb(false, {});


 }
 }
 catch (excep) {

 cb(false, {});

 }
 });
 }
 };*/
