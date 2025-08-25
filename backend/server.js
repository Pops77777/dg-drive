import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";
import FormData from "form-data";

const app = express();
app.use(cors());

// 🟢 Yaha apna BOT TOKEN & CHAT ID daalo
const BOT_TOKEN = "PASTE_YOUR_BOT_TOKEN";
const CHAT_ID = "PASTE_YOUR_CHAT_ID";

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("document", req.file.buffer, req.file.originalname);

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).send("Upload failed");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
