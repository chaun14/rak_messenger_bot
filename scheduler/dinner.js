const cron = require('node-cron');
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);


const { sendMessage } = require('../messenger/messenger');
const { Menus, Subscribers } = require('../db/entities');

module.exports = async () => {

    console.log("[LOADING] Dinner scheduler started")

    cron.schedule("30 17 * * *", async () => {

        try {
            // on gen le message de menu
            console.log("Generating")

            let menus = await Menus.findAll({
                where: {
                    date: dayjs().format("YYYY-MM-DD"),
                    repas: "Diner",
                }
            });

            if (!menus || !menus.length) {

                console.log("No menu found for today's dinner")
                return
            }

            let message = "Repas du soir du RAK \n"
            for (let menu of menus) {
                message = message + '\n' + menu.plat.content
            }


            if (menus && menus.length && !menus[0].plat?.content?.toLowerCase().includes("fermé")) {
                message = message + '\n' + '\n' + "Le RAK sera normalement ouvert de " + "19h15" + " à " + "20h" + " "
            }

            // on gère messenger
            let subs = await Subscribers.findAll({ where: { active: true, type: 'messenger' } })
            for (let sub of subs) {
                if (sub.data_soir && sub.data_soir.active) {
                    await sendMessage(sub.target, message, { notification_messages_token: sub.data_soir.notification_messages_token })

                }

            }
        } catch (error) {
            console.error(error)
        }

    }, {
        scheduled: true,
        timezone: "Europe/Paris"
    });



}