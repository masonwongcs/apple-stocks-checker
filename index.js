const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
// const { checkStock, getAppleStocksDetails } = require("./fetch");
const { checkStock, getAppleStocksDetails } = require("./fetch.v2");

app.get("/", checkStock);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
