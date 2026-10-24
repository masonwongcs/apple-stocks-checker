import { NextResponse } from "next/server";
import axios from "axios";

const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const resendAPIKey = process.env.RESEND_API_KEY;

const sendMail = async (title, message, email) => {
  console.log(email);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendAPIKey}`,
    },
    body: JSON.stringify({
      from: `Stock Update <${resendFromEmail}>`,
      to: email,
      subject: title + "is available",
      html: `<pre>${message}</pre>`,
    }),
  });

  const data = await res.json();

  console.log(data);
};

const getAppleStocksDetails = (partId, email) => {
  const parts = partId;
  const url = new URL("https://www.apple.com/sg/shop/retail/pickup-message");
  url.searchParams.set("pl", "true");
  url.searchParams.set("parts.0", parts);
  url.searchParams.set("location", "210684");

  return new Promise((resolve, reject) => {
    axios
      .get(url.toString(), {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-SG,en;q=0.9",
          Referer: "https://www.apple.com/sg/shop/buy-iphone",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        timeout: 15000,
      })
      .then(async (response) => {
        const stores = response.data?.body?.stores;

        if (!Array.isArray(stores)) {
          reject(new Error("Apple returned an unexpected pickup response"));
          return;
        }

        const partsAvailability = stores.map((store) => {
          // console.log(store)
          const { storeName, partsAvailability } = store;

          // "storePickEligible": true,
          // "storeSearchEnabled": true,
          // "storeSelectionEnabled": true,
          const {
            pickupDisplay, // "available"
            pickupSearchQuote, // "Available Today"
          } = partsAvailability?.[parts] ?? {};

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

          await sendMail(parts, message, email);
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
      })
      .catch(reject);
  });
};

export const dynamic = "force-dynamic";

export async function GET(request) {
  const partID = request.nextUrl.searchParams.get("partID");
  const email = request.nextUrl.searchParams.get("email");

  const time = new Date().toLocaleTimeString();

  if (!partID || !email) {
    return NextResponse.json({
      message: "Please enter part ID and email",
      time,
    });
  }

  try {
    const response = await getAppleStocksDetails(partID, email);

    console.log(response);
    return NextResponse.json({
      message: response,
      time,
    });
  } catch (error) {
    const status = error.response?.status;
    console.error("Apple stock check failed", status ?? error.message);
    return NextResponse.json(
      {
        message: status
          ? `Apple stock check failed (${status})`
          : "Apple stock check failed",
        time,
      },
      { status: 502 }
    );
  }
}
