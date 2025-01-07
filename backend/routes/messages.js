const express = require("express");
const Message = require("../models/Message.js");
const User = require("../models/User.js");
const mongoose = require("mongoose"); 
const router = express.Router();

router.post("/send", async (req, res) => {
    try {
      let { sender, receiver, text } = req.body;
  
      if (!sender || !receiver || !text) {
        return res.status(400).json({ error: "Всі поля обов'язкові!" });
      }
  
      if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
        return res.status(400).json({ error: "Невірний формат ObjectId" });
      }
  
      sender = new mongoose.Types.ObjectId(sender);
      receiver = new mongoose.Types.ObjectId(receiver);
  
      const message = new Message({ sender, receiver, text });
      await message.save();
  
      res.status(201).json({ message: "Повідомлення відправлено", data: message });
    } catch (error) {
      console.error("❌ Помилка при відправці повідомлення:", error);
      res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
  });

router.get("/:sender/:receiver", async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Помилка сервера" });
  }
});

module.exports = router;
