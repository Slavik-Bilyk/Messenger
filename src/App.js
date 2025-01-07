import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function App() {
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token"); 
    if (storedToken) {
      setToken(storedToken);
      connectWebSocket(storedToken);
    }
  }, []);

  const connectWebSocket = (authToken) => {
    const socket = io("http://localhost:5000", {
      auth: { token: authToken },
    });

    socket.on("connect", () => {
      console.log("✅ WebSocket підключено:", socket.id);
    });

    socket.on("receiveMessage", (data) => {
      console.log("📩 Нове повідомлення:", data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on("userOnline", (data) => {
      console.log("🟢 Користувач онлайн:", data);
    });

    socket.on("userOffline", (data) => {
      console.log("🔴 Користувач офлайн:", data);
    });
  };

  const login = async () => {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        password: "123456",
      }),
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token); 
      connectWebSocket(data.token);
    }
  };

  const sendMessage = () => {
    if (message.trim() === "") return;
    const newMessage = {
      sender: "65f8b2a7a3d5a26f6b9c1e12",
      receiver: "65f6d2a123456789abcdef12",
      text: message,
    };
    io("http://localhost:5000").emit("sendMessage", newMessage);
    setMessage("");
  };

  return (
    <div>
      <h1>Чат</h1>
      {!token && <button onClick={login}>🔑 Увійти</button>}
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        placeholder="Введіть повідомлення..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Надіслати</button>
    </div>
  );
}

export default App;
