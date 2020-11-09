const cron = require("node-cron");
const axios = require("axios");
const nodemailer = require("nodemailer");

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const to = process.env.TO;

// MHLT3ZA/A
// MHLQ3ZA/A

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
      from: to,
      to: to,
      subject: "Apple Leather Case",
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
        `https://www.apple.com/sg/shop/retail/pickup-message?parts.0=${partID}&searchNearby=true&store=R669`
      )
      .then(async (response) => {
        const data = response.data.body;
        const { stores } = data;

        const isAvailable = stores.find(
          (item) => item.partsAvailability[partID].storeSelectionEnabled
        );

        if (isAvailable) {
          const message = `${isAvailable.storeName} have stocks now.`;
          const { error, message: emailMessage } = await sendMail(message);
          console.log(isAvailable.storeName);
          if (error) {
            resolve(emailMessage);
          } else {
            resolve(`${isAvailable.storeName}, ${emailMessage}`);
          }
        } else {
          console.log("No Stock");
          resolve("No Stock");
        }
      });
  });
};

module.exports = async (req, res) => {
  const partID = req.query.partID;
  const response = await getAppleStocksDetails(partID);

  console.log(response);
  res.json({
    message: response,
  });
};
