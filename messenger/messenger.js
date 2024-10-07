


const { fetch } = require('undici');
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const TOKEN = process.env.FB_APP_TOKEN



async function sendMessage(recipient, message, options) {
    console.log("Sendping message " + message)

    let recipientData = {}
    if (recipient) recipientData.id = recipient;
    if (options && options.notification_messages_token) recipientData.notification_messages_token = options.notification_messages_token

    try {
        let res = await fetch(`https://graph.facebook.com/v19.0/${process.env.FB_APP_ID}/messages`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: TOKEN,
                messaging_type: "RESPONSE",
                recipient: recipientData,
                message: {
                    text: message
                }
            })
        });
        resJson = await res.json()
        console.log(resJson)
        console.log(res.status + " " + res.statusText + " " + res.body && res.body.message ? res.body : "")
    } catch (error) {
        console.error(error)
    }



}



async function sendSubscribeMessage(recipient, title, options) {
    if (!options) options = {}


    console.log("sendSubscribeMessage to " + recipient)


    try {
        let res = await fetch(`https://graph.facebook.com/v19.0/${process.env.FB_APP_ID}/messages`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: TOKEN,
                messaging_type: "RESPONSE",
                recipient: {
                    id: recipient
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "notification_messages",
                            notification_messages_cta_text: "SIGN_UP",
                            notification_messages_timezone: "Europe/Paris",
                            title: title,
                            image_url: options && options.image_url ? options.image_url : "https://hub.imt-atlantique.fr/rak/wp-content/uploads/2022/06/rak_batiment-1.jpg",
                            payload: "getRakMenus",
                        }
                    }
                }
            })
        });
        resJson = await res.json()
        console.log(resJson)
        //     console.error(JSON.stringify(resJson))
        if (resJson.error && resJson.error.error_user_title == "Duplicate Opt In Message") {
            sendMessage(recipient, "⏳ Vous avez déjà recu récemment un message proposant de vos abonnez, scrollez un peu pour retrouver le bouton pour vous abonner au notification du midi ☀️ ou du soir 🌙")
        }
        console.log(res.status + " " + res.statusText + " " + res.body && res.body.message ? res.body : "")
    } catch (error) {
        console.error(error)



    }



}

module.exports = { sendMessage, sendSubscribeMessage }