const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/auth.js");
const messageRoutes = require("./routes/messages.js");
const User = require("./models/User.js"); 

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


  io.on("connection", async (socket) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.log("❌ Відключено: немає токена");
        return socket.disconnect();
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log("❌ Відключено: користувач не знайдений");
        return socket.disconnect();
      }
  
      console.log(`✅ Користувач ${user.username} (${socket.id}) підключився`);
      socket.userId = user._id;
  
      io.emit("userOnline", { userId: user._id, username: user.username });
  
      socket.on("sendMessage", async (data) => {
        const { sender, receiver, text } = data;
  
        const message = new Message({ sender, receiver, text });
        await message.save();
  
        const recipientSocket = [...io.sockets.sockets.values()].find(
          (s) => s.userId && s.userId.toString() === receiver
        );
  
        if (recipientSocket) {
          recipientSocket.emit("receiveMessage", message); 
        }
  
        socket.emit("receiveMessage", message); 
      });
  
      socket.on("disconnect", async () => {
        console.log(`❌ Користувач ${user.username} (${socket.id}) відключився`);
        io.emit("userOffline", { userId: user._id });
      });
  
    } catch (error) {
      console.log("❌ Помилка авторизації:", error.message);
      socket.disconnect();
    }
  });

server.listen(5000, () => console.log("🚀 Сервер працює на порті 5000"));
