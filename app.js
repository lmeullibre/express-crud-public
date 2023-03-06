const express = require("express");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/categories", require("./routes/categories"));
app.use("/sentences", require("./routes/sentences"));
app.use("/misc", require("./controllers/misc"));
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.redirect("/sentences/list");
});

module.exports = app;
