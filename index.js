import config from "./config.json" assert { type: "json" };
import express from "express";
import { readdir } from "fs";
import { join, dirname, extname } from "path";
import cors from "cors";
import { fileTypeFromBuffer } from "file-type";
import { readChunk } from "read-chunk";
import multer from "multer";

const app = express();
app.use(cors());
app.set("view engine", "ejs");
const __dirname = join(dirname(decodeURI(new URL(import.meta.url).pathname))).replace(/^\\([A-Z]:\\)/, "$1");
app.use(express.static(join(__dirname, "icons"))); // Icons for file types
app.use(express.static(join(__dirname, "styles"))); // CSS won't work without that
app.use(express.static(join(__dirname, "public"))); // Your files are there

const servedPath = join(__dirname, "public");

app.get("/:dir(*)", (req, res) => {
  let directoryPath = servedPath;
  if (req.params.dir) {
    directoryPath = join(servedPath, req.params.dir);
  }
  readdir(directoryPath, { withFileTypes: true }, async (err, dirents) => {
    if (err) {
      res.status(500).render("500", { error: err, dir: directoryPath });
    } else {
      // Directories on top
      const sortedFiles = dirents.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) {
          return -1;
        }
        if (!a.isDirectory() && b.isDirectory()) {
          return 1;
        }
        return 0;
      });

      // Add mimeType property to each dirent
      const filesWithMimeType = await Promise.all( sortedFiles.map(async (dirent) => {
        const fullPath = join(directoryPath, dirent.name);
        if (dirent.isDirectory()) {
            dirent.type = "folder"; // Hate me all you want
          } else {
            const buffer = await readChunk(fullPath, {
              // read the first 4100 bytes of each file starting from 0
              length: 4100,
              startPosition: 0,
            });
            const typeInfo = await fileTypeFromBuffer(buffer);
            dirent.type = typeInfo ? typeInfo.mime : "file";
          }
        return dirent;
      }));
      // Render the EJS template and pass the sorted file list to it
      res.render("index", { files: filesWithMimeType, metaTitle: config.title, currentPath: req.path });
    }
  });
});

const hexToString = (hex) => {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const hexValue = hex.substr(i, 2);
    const decimalValue = parseInt(hexValue, 16);
    str += String.fromCharCode(decimalValue);
  }
  return str;
};

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let finalDir = servedPath + hexToString(req.params.dir)
    cb(null, finalDir);
  },
  filename: function(req, file, cb) {
      cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload/:dir?', upload.array('files'), (req, res) => {
  console.log("uploaded")
  // res.json({ message: 'Files uploaded successfully.' });
});

app.listen(config.port, () =>
  console.log(`Server is listening on port ${config.port}`)
);
