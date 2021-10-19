const cron = require("node-cron");
const axios = require("axios");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const to1 = process.env.TO;
const to2 = process.env.TO2;

const mailList = [to1, to2];

const sendMail = (message) => {
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: username,
        pass: password,
      },
    });

    const mailOptions = {
      from: to1,
      to: mailList,
      subject: "14-inch MacBook",
      text: message,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        resolve({
          error: true,
          message: error,
        });
      } else {
        console.log("Email sent: " + info.response);
        resolve({
          error: false,
          message: "Email sent: " + info.response,
        });
      }
    });
  });
};

const getAppleStocksDetails = (partID) => {
  return new Promise((resolve) => {
    axios
      .get(
        `https://www.apple.com/sg/shop/fulfillment-messages?parts.0=MYDC2ZP%2FA&parts.1=MKGP3ZP%2FA&parts.2=MKGR3ZP%2FA&postalCode=210684&geoLocated=false&mt=regular&store=R633&_=1634613330544`
        // `https://www.apple.com/sg/shop/fulfillment-messages?parts.0=${partID}&searchNearby=true&mt=regular&store=R633&_=${Date.now()}`
        // `https://www.apple.com/sg/shop/retail/pickup-message?parts.0=${partID}&searchNearby=true&store=R669`
      )
      .then(async (response) => {
        const data = response.data.body;
        const {
          content: { deliveryMessage },
        } = data;

        const isBuyable = deliveryMessage["MKGP3ZP/A"].isBuyable;

        console.log(isBuyable);

        if (isBuyable) {
          sendMail("MKGP3ZP/A is available now.");
          resolve("MKGP3ZP/A is available now.");
        } else {
          sendMail("No Stocks");
          resolve("No Stocks");
        }

        // const isAvailable = stores.find(
        //   (item) => item.partsAvailability[partID].storeSelectionEnabled
        // );
        //
        // if (isAvailable) {
        //   const message = `${isAvailable.storeName} have stocks now.`;
        //   const { error, message: emailMessage } = await sendMail(message);
        //   console.log(isAvailable.storeName);
        //   if (error) {
        //     resolve(emailMessage);
        //   } else {
        //     resolve(`${isAvailable.storeName}, ${emailMessage}`);
        //   }
        // } else {
        //   console.log("No Stock");
        //   resolve("No Stock");
        // }
      });
  });
};

cron.schedule("5 * * * *", () => {
  getAppleStocksDetails();
});

module.exports = async (req, res) => {
  const partID = req.query.partID;
  const response = await getAppleStocksDetails(partID);

  console.log(response);
  res.json({
    message: response,
  });
};
