
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);


const { Subscribers, Menus } = require('../db/entities');
const { sendSubscribeMessage, sendMessage } = require('./messenger');



module.exports = (req, res) => {
  //console.log(req.body);
  // console.log("Got a message yay x)")


  console.log(JSON.stringify(req.body))

  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(async event => {
        // if that's a basic message
        if (event.message && event.message.text) {
          console.log(event)

          if (event.message.text) {
            let msg = event.message.text.toLowerCase();
            if (msg == "ping") {
              sendMessage(event.sender.id, "Pong 🏓")

            }
            else if (msg == "credits") {
              sendMessage(event.sender.id, "Ce bot a été développé par @roman_grry. Son code sources est disponible sur github :o\n\nhttps://www.facebook.com/profile.php?id=61550077430361\nhttps://github.com/chaun14/rak_messenger_bot")
            }
            else if (msg == "midi") {

              let menus = await Menus.findAll({
                where: {
                  date: dayjs().format("YYYY-MM-DD"),
                  repas: "Dejeuner",
                }
              });
              let message = "Repas du midi du RAK \n"
              for (let menu of menus) {
                message = message + '\n' + menu.plat.content
              }

              if (menus && menus.length && !menus[0].plat?.content?.toLowerCase().includes("fermé")) {
                if (dayjs().day() == 5 || dayjs().day() == 6) {
                  message = message + '\n' + '\n' + "Le RAK sera normalement ouvert de " + "12h15" + " à " + "13h" + " "

                } else {
                  message = message + '\n' + '\n' + "Le RAK sera normalement ouvert de " + "11h30" + " à " + "13h15" + " "

                }
              }

              sendMessage(event.sender.id, message)

            }
            else if (msg == "soir") {

              let menus = await Menus.findAll({
                where: {
                  date: dayjs().format("YYYY-MM-DD"),
                  repas: "Diner",
                }
              });
              let message = "Repas du soir du RAK \n"
              for (let menu of menus) {
                message = message + '\n' + menu.plat.content
              }
              if (menus && menus.length && !menus[0].plat?.content?.toLowerCase().includes("fermé")) {
                message = message + '\n' + '\n' + "Le RAK sera normalement ouvert de " + "19h15" + " à " + "20h" + " "
              }


              sendMessage(event.sender.id, message)

            }
            else if (msg == "start" || msg == "subscribe" || msg == "sub") {

              await sendSubscribeMessage(event.sender.id, "Recevoir les menus du midi du RAK")
              await sendSubscribeMessage(event.sender.id, "Recevoir les menus du soir du RAK")
            }
            else if (msg == 'stop' || msg == "subscribe" || msg == "sub") {
              // first get the status of this member subscription
              let userSub = await Subscribers.findOne({ where: { target: event.sender.id, type: "messenger" } })

              if (userSub && userSub.active) {
                let data_midi = userSub.data_midi ? userSub.data_midi : {}
                let data_soir = userSub.data_soir ? userSub.data_soir : {}
                await userSub.update({ active: false, data_soir, data_midi })
                sendMessage(event.sender.id, "Vous ne recevrez plus les menus du RAK. Vous pouvez toujours envoyer 'start' pour vous réabonner.")
              } else {
                sendMessage(event.sender.id, "Vous n'êtes pas abonné aux notifications de menu. Envoyez 'start' pour vous abonner.")
              }

            }
            else if (msg == "help") {
              let message = 'Voici la liste des commandes disponibles: \n\n"midi" pour obtenir le menu du midi \n"soir" pour obtenir le menu du soir \n"start" pour vous abonner aux notifications de menu\n"stop" pour vous désabonner aux notifications de menu\n"credits" Mais qui à fait ce bot? \n\nEnvoyez "help" pour obtenir la liste des commandes'
              sendMessage(event.sender.id, message)

            }
            else {
              let message = "Commande inconnue \:( \nEnvoyez \"help\" pour obtenir la liste des commandes"
              sendMessage(event.sender.id, message)
            }




          }

        }

        // if that's an optin/out message
        else if (event.optin && event.optin.type == "notification_messages") {
          if (event.optin.notification_messages_status == "RESUME_NOTIFICATIONS" || !event.optin.notification_messages_status) {
            // if that's a new subscription from a new member

            // first get the status of this member subscription

            let userSub = await Subscribers.findOne({ where: { target: event.sender.id, type: "messenger" } })
            let mode = event.optin.title.includes("midi") ? "midi" : "soir"

            if (userSub) {
              let data_midi = mode == "midi" ? { token_expiry_timestamp: event.optin.token_expiry_timestamp, notification_messages_token: event.optin.notification_messages_token, active: true } : userSub.data_midi ? userSub.data_midi : {}
              let data_soir = mode == "soir" ? { token_expiry_timestamp: event.optin.token_expiry_timestamp, notification_messages_token: event.optin.notification_messages_token, active: true } : userSub.data_soir ? userSub.data_soir : {}


              await userSub.update({ active: true, data_soir, data_midi })

              sendMessage(event.sender.id, "Bien reçu, vous recevrez désormais à nouveau le menu tous les jours quelques heures avant le repas du " + mode + " !")



            } else {
              let data_midi = event.optin.title.includes("midi") ? { token_expiry_timestamp: event.optin.token_expiry_timestamp, notification_messages_token: event.optin.notification_messages_token, active: true } : {}
              let data_soir = event.optin.title.includes("soir") ? { token_expiry_timestamp: event.optin.token_expiry_timestamp, notification_messages_token: event.optin.notification_messages_token, active: true } : {}
              await Subscribers.create({ type: 'messenger', target: event.sender.id, active: true, data_midi, data_soir })

              sendMessage(event.sender.id, "Bien reçu, vous recevrez désormais le menu tous les jours quelques heures avant le repas du " + mode + " !")
            }
          } else if (event.optin.notification_messages_status == "STOP_NOTIFICATIONS") {
            let mode = event.optin.title.includes("midi") ? "midi" : "soir"

            let userSub = await Subscribers.findOne({ where: { target: event.sender.id, type: "messenger" } })
            let data_midi = mode == "midi" ? { active: false } : userSub.data_midi ? userSub.data_midi : {}
            let data_soir = mode == "soir" ? { active: false } : userSub.data_soir ? userSub.data_soir : {}

            let activeStatus = true;
            if (!data_midi.active && !data_soir.active) activeStatus = false

            await userSub.update({ active: activeStatus, data_midi, data_soir })

            sendMessage(event.sender.id, `Votre demande a bien été prise en compte et vous ne receverez désormais plus les menus du ${mode} du RAK. Vous pouvez toujours envoyer '${mode}' pour les demander manuellement. Pour se réinscrire envoyez 'sub'`)
          }
        }


      });
    });

    res.status(200).end();
  }
};