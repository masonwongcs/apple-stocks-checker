const axios = require("axios");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config();

const username = process.env.USERNAME;
const password = process.env.PASSWORD;

const sendMail = (title, message, email) => {
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
      from: "masonwongcs@gmail.com",
      to: email,
      subject: title + "is available",
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

const getAppleStocksDetails = (partId, email) => {
  const parts = partId;
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
            pickupDisplay, // "available"
            pickupSearchQuote, // "Available Today"
            storeSelectionEnabled,
          } = partsAvailability[parts];

          const isAvailable =
            pickupDisplay === "available" &&
            pickupSearchQuote === "Available Today";

          return {
            available: isAvailable,
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

          sendMail(parts, message, email);
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
  const email = req.query.email;
  const time = new Date().toLocaleTimeString();

  if (!(partID && email)) {
    res.json({
      message: "Please enter part ID and email",
      time,
    });
  }

  const response = await getAppleStocksDetails(partID, email);

  console.log(response);
  res.json({
    message: response,
  });
};

module.exports = {
  checkStock,
  getAppleStocksDetails,
};
