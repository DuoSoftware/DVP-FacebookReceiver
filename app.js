var restify = require('restify');
var config = require('config');
var authorization = require('dvp-common/Authentication/Authorization.js');
var fb = require('./Services/FacebookClient');
var token = config.Services.accessToken;
var fs = require('fs');
var bodyParser = require('body-parser');
var mongomodels = require('dvp-mongomodels');
var ValidateWebhook = require('./Services/ValidateWebhook');

restify.CORS.ALLOW_HEADERS.push('authorization');
// Setup some https server options

var https_options = {
    /* ca: fs.readFileSync('/etc/ssl/fb/COMODORSADomainValidationSecureServerCA.crt'),
     key: fs.readFileSync('/etc/ssl/fb/SSL1.txt'),
     certificate: fs.readFileSync('/etc/ssl/fb/STAR_duoworld_com.crt')*/
};

var https_server = restify.createServer(https_options);


// Put any routing, response, etc. logic here. This allows us to define these functions
// only once, and it will be re-used on both the HTTP and HTTPs servers
var setup_server = function (server) {

    server.pre(restify.pre.userAgentConnection());
    //server.use(restify.bodyParser({mapParams: false}));
    server.use(restify.queryParser());
    server.use(restify.CORS());
    server.use(restify.fullResponse());
    server.use(bodyParser.json({ verify: ValidateWebhook.verifyRequestSignature }));

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    server.get('/', function (req, res) {
        console.log(req);
        res.send('It works!');
    });

    server.get('/facebook', function (req, res) {
        if (
            req.params.hub.mode == 'subscribe' &&
            req.params.hub.verify_token == 'token'
        ) {
            res.setHeader('content-type', 'text/plain');
            res.send(req.params.hub.challenge);
            /*res.send(req.params.hub.challenge.toString());*/
        } else {
            res.send(400);
        }
    });

    server.post('/facebook', function (req, res) {
        console.log('Facebook request body:');
        console.log(JSON.stringify(req.body));
        // Process the Facebook updates here
        //res.send(200);
        fb.RealTimeUpdates(req.body);
        res.status(200);
        res.end();

    });

};

// Now, setup both servers in one step
setup_server(https_server);

https_server.listen(4433, function () {
    console.log('%s listening at %s', https_server.name, https_server.url);
});
