var crypto = require('crypto');
var config = require('config');


module.exports.verifyRequestSignature = function (req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
        res.end(new Error("Couldn't validate the signature."));
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac(method, config.SocialConnector.fb_application_secret)
            .update(buf)
            .digest('hex');

        if (signatureHash !== expectedHash) {
            console.error("Couldn't validate the request signature.");
            res.end(new Error("Couldn't validate the request signature."));
        }
    }
};
