const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth.js"); 
const messageRoutes = require("./routes/messages.js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes); 
app.use("/api/messages", messageRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Підключено до MongoDB"))
  .catch((error) => console.error("❌ Помилка підключення до MongoDB:", error));

io.on("connection", (socket) => {
  console.log("✅ Користувач підключився:", socket.id);

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Користувач відключився:", socket.id);
  });
});

server.listen(5000, () => console.log("🚀 Сервер працює на порті 5000"));
