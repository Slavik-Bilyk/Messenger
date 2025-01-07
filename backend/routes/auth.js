const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const router = express.Router();

// 📌 Реєстрація користувача
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Користувач створений" });
  } catch (error) {
    res.status(400).json({ error: "Помилка реєстрації" });
  }
});

// 📌 Вхід користувача
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Користувач не знайдений" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Неправильний пароль" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Помилка сервера" });
  }
});

module.exports = router; // Важливо: Експортуємо через `module.exports`
