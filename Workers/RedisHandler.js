// /**
//  * Created by Rajinda on 2/22/2018.
//  */

// var format = require('stringformat');
// var config = require('config');
// var redis = require('ioredis');
// var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
// var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
// var Q = require('q');


// var redisip = config.Redis.ip;
// var redisport = config.Redis.port;
// var redispass = config.Redis.password;
// var redismode = config.Redis.mode;
// var redisdb = config.Redis.db;



// var redisSetting =  {
//     port:redisport,
//     host:redisip,
//     family: 4,
//     password: redispass,
//     db: redisdb,
//     retryStrategy: function (times) {
//         var delay = Math.min(times * 50, 2000);
//         return delay;
//     },
//     reconnectOnError: function (err) {

//         return true;
//     }
// };

// if(redismode == 'sentinel'){

//     if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port && config.Redis.sentinels.name){
//         var sentinelHosts = config.Redis.sentinels.hosts.split(',');
//         if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
//             var sentinelConnections = [];

//             sentinelHosts.forEach(function(item){

//                 sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

//             })

//             redisSetting = {
//                 sentinels:sentinelConnections,
//                 name: config.Redis.sentinels.name,
//                 password: redispass,
//                 db: redisdb
//             }

//         }else{

//             console.log("No enough sentinel servers found .........");
//         }

//     }
// }

// var redisClient = undefined;

// if(redismode != "cluster") {
//     redisClient = new redis(redisSetting);
// }else{

//     var redisHosts = redisip.split(",");
//     if(Array.isArray(redisHosts)){


//         redisSetting = [];
//         redisHosts.forEach(function(item){
//             redisSetting.push({
//                 host: item,
//                 port: redisport,
//                 family: 4,
//                 password: redispass,
//                 db: redisdb});
//         });

//         redisClient = new redis.Cluster([redisSetting]);

//     }else{

//         redisClient = new redis(redisSetting);
//     }


// }

// redisClient.auth(config.Redis.password, function (err) {
//     console.log("Redis Auth error  " + err);
// });

// redisClient.on("error", function (err) {
//     console.log("Redis connection error  " + err);
// });

// redisClient.on("connect", function (err) {
//     console.log("Redis connection   " + err);
// });



// module.exports.AddOwnerToList = function (tenantId,companyId,ownerPageId) {
//     // var id = format("facebook_page_subscribed:{0}:{1}", tenantId,companyId);
//     // return redisClient.lpush(id, ownerPageId);
//     var deferred = Q.defer();
//     var id = format("facebook_page_subscribed:{0}:{1}", tenantId,companyId);

//     redisClient.lpush(id, ownerPageId.toString(), function (err, reply) {
//         if (err) {
//             var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
//             logger.error(jsonString);
//             deferred.resolve(err, reply);
//         }
//         else {
//             deferred.resolve(reply);
//         }
//     });
//     return deferred.promise;
// };

// module.exports.RemoveOwnerFromList = function (tenantId,companyId,ownerPageId) {
//     // var id = format("facebook_page_subscribed:{0}:{1}", tenantId,companyId);
//     // return redisClient.lpush(id, ownerPageId);
//     var deferred = Q.defer();
//     var id = format("facebook_page_subscribed:{0}:{1}", tenantId,companyId);

//     redisClient.lrem(id, 0, ownerPageId.toString(), function (err, reply) {
//         if (err) {
//             var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
//             logger.error(jsonString);
//             deferred.reject(err);
//         }
//         else {
//             deferred.resolve(reply);
//         }
//     });
//     return deferred.promise;
// };

// module.exports.GetOwnersList = function (tenantId,companyId) {
//     var deferred = Q.defer();
//     var id = format("facebook_page_subscribed:{0}:{1}", tenantId,companyId);

//     redisClient.lrange(id, 0, -1, function (err, reply) {
//         if (err) {
//             var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
//             logger.error(jsonString);
//             deferred.reject(err);
//         }
//         else {
//             deferred.resolve(reply);
//         }
//     });
//     return deferred.promise;
// };
