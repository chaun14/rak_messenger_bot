const cron = require('node-cron');
const Parser = require("rss-parser");
let parser = new Parser();
const HTMLParser = require("node-html-parser");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);


const { Menus } = require('../db/entities');


module.exports = async () => {
    console.log("[LOADING] Fetcher scheduler started");

    cron.schedule('* 1 * * *', async () => {
        try {


            console.log('Fetching data from the RAK...')
            let feed = await parser.parseURL("http://services.imt-atlantique.fr/rak/rss/menus.xml");
            // console.log(feed.title);

            let insertCount = 0;
            feed.items.forEach(async (item) => {
                //console.log(item.title);

                // split by " " then filter only the dates
                let dates = item.title.split(" ").filter((word) => word.match(/\d{2}\/\d{2}\/\d{4}/));
                let weekStart = dayjs(dates[0], "DD/MM/YYYY");

                var root = HTMLParser.parse(item.content);
                // console.log(root);

                let interestingStuff = [];
                for (var i = 0; i < root.childNodes.length; i++) {
                    let raw = root.childNodes[i].rawText.replace(/\n/g, "");
                    //console.log(root.childNodes[i].rawText);
                    if (raw != "" && !raw.includes("|") && raw.replace(/\ /g, "") != "---" && raw != " " && !raw.includes("Rampe")) {
                        interestingStuff.push({ content: raw, link: root.childNodes[i].rawAttrs.includes("http://") ? root.childNodes[i].rawAttrs : null });
                    }
                }
                //console.log(interestingStuff);

                let weekMeal = [];
                let weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
                let weekDates = {};
                for (var i = 0; i < 7; i++) weekDates[weekDays[i]] = weekStart.add(i, "day").format("DD/MM/YYYY");

                let mealTypes = ["Dejeuner", "Diner"];
                let currentDay = "";
                let currentMeal = "";
                for (var i = 0; i < interestingStuff.length; i++) {
                    if (weekDays.includes(interestingStuff[i].content)) {
                        currentDay = interestingStuff[i].content;

                        weekMeal[currentDay] = { date: weekDates[currentDay], meals: [] };
                    } else {
                        if (mealTypes.includes(interestingStuff[i].content)) {
                            currentMeal = interestingStuff[i].content;
                            weekMeal[currentDay].meals[currentMeal] = [];
                        } else {
                            weekMeal[currentDay].meals[currentMeal].push(interestingStuff[i]);
                        }
                    }
                }

                //  console.log(weekMeal);

                for (let day in weekMeal) { // every day of the week
                    // console.log();

                    // delete the meals from the database in order to avoid duplicates and to keep the database up to date
                    await Menus.destroy({
                        where: {
                            date: weekMeal[day].date.split("/").reverse().join("-"),
                        }
                    });

                    for (let meal in weekMeal[day].meals) { // every meal of the day
                        for (let i = 0; i < weekMeal[day].meals[meal].length; i++) { // every dish of the meal
                            if (weekMeal[day].meals[meal][i]) {
                                weekMeal[day].meals[meal][i].link = weekMeal[day].meals[meal][i].link ? weekMeal[day].meals[meal][i].link.split(" ")[0].replace("HREF=", "") : ""
                            }


                            // console.log(weekMeal[day].date + '' + weekMeal[day].meals + ': ' + weekMeal[day].meals[meal][i].content);

                            await Menus.create({
                                date: weekMeal[day].date.split("/").reverse().join("-"),
                                repas: meal,
                                plat: weekMeal[day].meals[meal][i],
                            });
                            insertCount++

                        }

                    }
                }
                //  console.log(weekMeal["Vendredi"].meals["Dejeuner"])


            })
            console.log('Fetched ' + insertCount + " meals");
        } catch (error) {
            console.error(error)
        }
    });

}