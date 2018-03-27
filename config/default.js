module.exports = {


  TWITTER_KEY: 'dUTFwOCHWXpvuLSsgQ7zvOPRK',
  TWITTER_SECRET: 'KXDD9YRt58VddSTuYzvoGGGsNK5B5p9ElJ31WNLcZZkR4eVzp9',
  TWITTER_CALLBACK_URL:  'http://localhost:63342/DVP-AdminConsole/#/console/social/twitter',


  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"localhost",
    "Database":"dvpdb"
  },


  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }

  },


  "Security":
  {

    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }
  },


  "Host":
  {
    "ServerType": "SOCIALMEDIACONNECTOR",
    "CallbackOption": "GET",
    "RequestType": "CALL",
    "ServerID": 2,
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "4647",
    "smsQueueName": "SMSOUT",
    "smsmode": "smpp",
    'twitterQueueName': "TWEETOUT",
    'facebookQueueName': "FACEBOOKOUT",
    "version": "1.0.0.0"
  },



  "SMSServer":{


    "ip":"159.203.109.43",
    "port":"1401",
    "password":"bar",
    "user":"foo"



  },

  /*
  "SMPPClient":{

    "ip":"45.55.203.111",
    "port":"2775",
    "password":"pwd2",
    "user":"smppclient2"

  },
*/
  "SMPPClient":{

    "ip":"81.201.83.10",
    "port":"2777",
    "password":"Veery@123",
    "user":"veerysms"

  },



  "LBServer" : {

    "ip": "104.236.197.119",
    "port": "4647"

  },


  "Mongo":
  {
    "ip":"104.236.231.11",
    "port":"27017",
    "dbname":"dvpdb",
    "password":"DuoS123",
    "user":"duo",
    "replicaset" :"104.236.231.11"
  },



  "RabbitMQ":
  {
    "ip": "45.55.142.207",
    "port": 5672,
    "user": "admin",
    "password": "admin",
    "vhost":'/'
  },


  "Services" : {
    "accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiYWEzOGRmZWYtNDFhOC00MWUyLTgwMzktOTJjZTY0YjM4ZDFmIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE5MDIzODExMTgsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NzAzODExMTh9.Gmlu00Uj66Fzts-w6qEwNUz46XYGzE8wHUhAJOFtiRo",

    "resourceServiceHost": "resourceservice.app.veery.cloud",
    "resourceServicePort": "8831",
    "resourceServiceVersion": "1.0.0.0",


    "interactionurl": "interactions.app.veery.cloud",
    "interactionport": '3637',
    "interactionversion":"1.0",
    //


    "cronurl": "scheduleworker.app.veery.cloud",//scheduleworker.app.veery.cloud
    "cronport": '8080',
    "cronversion":"1.0.0.0",


    "ticketServiceHost": "liteticket.app.veery.cloud", //liteticket.app.veery.cloud
    "ticketServicePort": "3636",
    "ticketServiceVersion": "1.0.0.0",

    "ardsServiceHost": "ardsliteservice.app.veery.cloud",
    "ardsServicePort": "8831",
    "ardsServiceVersion": "1.0.0.0",

    "facebookUrl" : "https://graph.facebook.com/v2.8/",

    "ruleserviceurl" : "ruleservice.app.veery.cloud",
    "ruleserviceport" : "8888",
    "ruleserviceversion" : "1.0.0.0",

    "fileServiceHost": "fileservice.app.veery.cloud",
    "fileServicePort": 5645,
    "fileServiceVersion":"1.0.0.0"

  },

  "SocialConnector":
  {
    //"fb_client_id":"825442624259571",
    //"fb_client_secret":"85eab7232db0c38abd7d04baa358382f",
    //"owner_id":"124278164680278,124278164680845"


    
   // "fb_client_id":"1339841416135058",
   // "fb_client_secret":"21391d2aef1b811b53c11be90094bab6",
   // "owner_id":"891072687711352"

   "fb_client_id":"1653017581444883",
   "fb_client_secret":"5af6508ad08ef57b13848a0836bfca40",
    "owner_id":"891072687711352"
  }

};
