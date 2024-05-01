const cron = require('node-cron');
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);


const { sendMessage } = require('../messenger/messenger');
const { Menus, Subscribers } = require('../db/entities');


module.exports = async () => {
    // cron du repas du midi
    console.log("[LOADING] Lunch scheduler started");

    cron.schedule("45 10 * * *", async () => {


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

        // on gère messenger
        let subs = await Subscribers.findAll({ where: { active: true, type: 'messenger' } })
        for (let sub of subs) {
            if (sub.data_midi && sub.data_midi.active) {
                sendMessage(sub.target, message, { notification_messages_token: sub.data_midi.notification_messages_token })

            }
        }

    }, {
        scheduled: true,
        timezone: "Europe/Paris"
    });

}