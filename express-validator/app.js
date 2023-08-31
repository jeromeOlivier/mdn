const express = require("express");
const { query, matchedData, validationResult } = require("express-validator");
const app = express();

app.use(express.json());
app.get(
  "/hello",
  query("email").notEmpty().escape().trim().isEmail(),
  (req, res) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      const data = matchedData(req);
      return res.send(`Hello, ${data.email}!`);
    }
    res.send({ errors: result.array() });
  },
);

app.listen(3001);
