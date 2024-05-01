


const crypto = require('crypto');

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, next) {
    var signature = req.headers["x-hub-signature-256"];
    // console.log(signature)


    let buf = req.rawBody
    //console.log(buf)

    if (!signature) {
        console.warn(`Couldn't find "x-hub-signature-256" in headers.`);
    } else {
        var elements = signature.split("=");
        var signatureHash = elements[1];
        var expectedHash = crypto
            .createHmac("sha256", process.env.FB_APP_SECRET)
            .update(buf)
            .digest("hex");
        if (signatureHash != expectedHash) {
            res.status(401)
            throw new Error("Couldn't validate the request signature.");
        } else {
            next();
        }
    }
}

module.exports = verifyRequestSignature;