import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";
import FormData from "form-data";

const app = express();
app.use(cors());

// 🟢 Telegram Bot Details
const BOT_TOKEN = "8201382659:AAHz2ahAYhIlLn34n-MPlAKqC8EJ3jq92mM";
const CHAT_ID = "7937344818";

// File upload setup (memory storage use ho raha hai)
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
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

// Render ke liye PORT env variable use karna hoga
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
