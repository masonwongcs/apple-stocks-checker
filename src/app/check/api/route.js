import { NextResponse } from "next/server";
import axios from "axios";
import { Resend } from "resend";

const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const resendAPIKey = process.env.RESEND_API_KEY;

const sendMail = (title, message, email) => {
  const resend = new Resend(resendAPIKey);

  console.log(email);

  resend.emails.send({
    from: `Stock Update <${resendFromEmail}>`,
    to: email,
    subject: title + "is available",
    html: `<pre>${message}</pre>`,
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

export async function GET(request) {
  const partID = request.nextUrl.searchParams.get(["partID"]);
  const email = request.nextUrl.searchParams.get(["email"]);

  const time = new Date().toLocaleTimeString();

  if (!partID || !email) {
    return NextResponse.json({
      message: "Please enter part ID and email",
      time,
    });
  }

  const response = await getAppleStocksDetails(partID, email);

  console.log(response);
  return NextResponse.json({
    message: response,
    time,
  });
}
