const express = require("express");
const db = require("../firebase");
const readline = require("readline");
const fs = require("fs");
const multer = require("multer");
const sentenceController = require("./sentences");

const upload = multer({ dest: "tmp/" });

const router = express.Router();

router.delete("/purge", async (req, res) => {});

router.post("/parse", upload.single("file"), async (req, res, next) => {
  const fileStream = fs.createReadStream(req.file.path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const dummyReq = {};
  const dummyRes = {
    send: (data) => console.log("dummy data", data),
    status: (code) => {
      console.log(`Status code: ${code}`);
      return dummyRes;
    },
  };

  rl.on("line", async (line) => {
    try {
      const { text, cats } = JSON.parse(line);
      const categories = Object.keys(cats).filter((key) => cats[key] === 1);
      const sentence = { text, categories };
      dummyReq.body = sentence;
      await sentenceController.createSentence(dummyReq, dummyRes);
    } catch (error) {
      console.log(error);
    }
  });

  rl.on("close", () => {
    console.log("File read complete.");
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("File deleted successfully");
    });
    res.send("File read complete.");
  });
});

router.get("/common-words", async (req, res) => {
  try {
    const itemsSnapshot = await db.collection("sentences").get();

    const wordMap = new Map();

    itemsSnapshot.forEach((itemDoc) => {
      const itemData = itemDoc.data();
      const text = itemData.text;
      const words = text.toLowerCase().split(/\W+/);
      words.forEach((word) => {
        if (word !== "") {
          if (wordMap.has(word)) {
            wordMap.set(word, wordMap.get(word) + 1);
          } else {
            wordMap.set(word, 1);
          }
        }
      });
    });

    const sortedWords = Array.from(wordMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const commonWords = sortedWords.slice(0, 100).map((entry) => entry[0]);

    res.json(commonWords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to fetch common words" });
  }
});
module.exports = router;
