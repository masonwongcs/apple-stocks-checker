const axios = require("axios");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const to1 = process.env.TO;
const to2 = process.env.TO2;
const to3 = process.env.TO3;

const mailList = [to1, to2, to3];

const sendMail = (message) => {
  return new Promise(async (resolve) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: username,
        pass: password,
      },
    });

    await new Promise((resolve, reject) => {
      // verify connection configuration
      transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log("Server is ready to take our messages");
          resolve(success);
        }
      });
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
  // 14-inch MKGP3ZP/A
  // 13-inch MYDC2ZP/A
  const parts = partID ? partID : "MYDC2ZP/A";
  return new Promise((resolve) => {
    axios
      .get(
        `https://www.apple.com/sg/shop/fulfillment-messages?parts.0=${parts}&location=210684&mt=regular&_=${Date.now()}`
        // "https://www.apple.com/sg/shop/fulfillment-messages?parts.0=MKGP3ZP%2FA&location=210684&mt=regular&_=1634994349383",
        // `https://www.apple.com/sg/shop/fulfillment-messages?parts.0=MYDC2ZP%2FA&parts.1=MKGP3ZP%2FA&parts.2=MKGR3ZP%2FA&postalCode=210684&geoLocated=false&mt=regular&store=R633&_=1634613330544`
        // `https://www.apple.com/sg/shop/fulfillment-messages?parts.0=${partID}&searchNearby=true&mt=regular&store=R633&_=${Date.now()}`
        // `https://www.apple.com/sg/shop/retail/pickup-message?parts.0=${partID}&searchNearby=true&store=R669`
      )
      .then(async (response) => {
        const data = response.data.body;
        const {
          content: { deliveryMessage, pickupMessage },
        } = data;

        const stores = pickupMessage.stores;

        const partsAvailability = stores.map((store) => {
          // console.log(store)
          const { storeName, partsAvailability } = store;

          // "storePickEligible": true,
          // "storeSearchEnabled": true,
          // "storeSelectionEnabled": true,
          const {
            storePickEligible,
            storeSearchEnabled,
            storeSelectionEnabled,
          } = partsAvailability[parts];

          return {
            available:
              storePickEligible && storeSearchEnabled && storeSelectionEnabled,
            name: storeName,
          };
        });

        console.log(partsAvailability);

        // const isBuyable = deliveryMessage["MKGP3ZP/A"].isBuyable;
        const isBuyable = partsAvailability.some((part) => part.available);

        console.log(isBuyable);

        if (isBuyable) {
          const message = `${parts} is available to pickup at: \n${partsAvailability
            .filter(({ available }) => available)
            .map(({ name }) => `${name}`)
            .join("\n")}`;

          sendMail(message);
          resolve(message);
        } else {
          // sendMail("No Stocks");
          resolve(`${parts} is not available for pickup`);
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

const checkStock = async (req, res) => {
  const partID = req.query.partID;
  const response = await getAppleStocksDetails(partID);

  console.log(response);
  res.json({
    message: response,
  });
};

module.exports = {
  checkStock,
  getAppleStocksDetails,
};
