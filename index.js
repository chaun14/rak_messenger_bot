const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config()


const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);








const { Menus, Subscribers, sequelize } = require('./db/entities');
const verifyRequestSignature = require('./messenger/middleware/authenticate');
const router = require('./messenger/router');
const fetcher = require('./scheduler/fetcher');
const lunch = require('./scheduler/lunch');
const dinner = require('./scheduler/dinner');

async function main() {


  const app = express();

  // database stuff
  try {
    console.log("[SEQUELIZE] Loading database")
    await sequelize.authenticate();
    console.log('[SEQUELIZE] Connection has been established successfully.');
  } catch (error) {
    console.error('[SEQUELIZE] Unable to connect to the database:', error);
    process.exit(1);
  }

  // scheduler stuff
  fetcher()
  lunch()
  dinner()


  // await Subscribers.sync({ force: true });
  // await Menus.sync({ force: true });


  // get raw buffer to verify its signagture
  app.use(
    bodyParser.json({
      verify: function (req, res, buf, encoding) {
        //console.log("buf", buf);
        req.rawBody = buf;
      },
    })
  );
  app.use(verifyRequestSignature);
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use("/", router)

  const port = process.env.PORT ? process.env.PORT : 3000

  app.listen(port, () => console.log('Express server is listening on port ' + port));



}

main()