const config = require("./config.json");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors")

const app = express();
app.use(cors())
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'styles'))); // CSS won't work without that
app.use(express.static(path.join(__dirname, "public"))); // Your files are there

app.get("/", (req, res) => {
  const directoryPath = path.join(__dirname, "public");
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      res.status(500).send("Error reading directory" + directoryPath);
    } else {
      // Render the EJS template and pass the file list to it
      res.render("index", { files: files });
    }
  });
});

app.listen(config.port, () =>
  console.log(`Server is listening on port ${config.port}`)
);