const cron = require("node-cron");
const axios = require("axios");
const nodemailer = require("nodemailer");

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const to = process.env.TO;

// MHLT3ZA/A
// MHLQ3ZA/A

const sendMail = (message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: username,
      pass: password,
    },
  });

  const mailOptions = {
    from: to,
    to: to,
    subject: "Apple Leather Case",
    text: message,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const getAppleStocksDetails = (partID) => {
  axios
    .get(
      `https://www.apple.com/sg/shop/retail/pickup-message?parts.0=${partID}&searchNearby=true&store=R669`
    )
    .then((response) => {
      const data = response.data.body;
      const { stores } = data;

      const isAvailable = stores.find(
        (item) => item.partsAvailability[partID].storeSelectionEnabled
      );

      if (isAvailable) {
        const message = `${isAvailable.storeName} have stocks now.`;
        sendMail(message);
        console.log(isAvailable.storeName);
        return isAvailable.storeName;
      } else {
        console.log("No Stock");
        return "No Stock";
      }
    });
};

module.exports = (req, res) => {
  const partID = req.query.partID;
  const response = getAppleStocksDetails(partID);

  res.json({
    message: response
  })
};
