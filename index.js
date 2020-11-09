const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const checkStock = require("./api/fetch");

app.get("/", checkStock);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
