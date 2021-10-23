const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cron = require("node-cron");
const { checkStock, getAppleStocksDetails } = require("./fetch");

app.get("/", checkStock);

cron.schedule("5 * * * *", () => {
  getAppleStocksDetails();
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
