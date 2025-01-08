import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") },
}); 

function App() {
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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
      setToken(data.token);
      socket.auth = { token: data.token }; 
      socket.connect();
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ WebSocket підключено:", socket.id);
    });

    socket.on("receiveMessage", (data) => {
      console.log("📩 Нове повідомлення:", data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on("userOnline", (data) => {
      console.log("🟢 Користувач онлайн:", data);
      setUsers((prevUsers) => {
        const exists = prevUsers.some((user) => user.userId === data.userId);
        return exists ? prevUsers : [...prevUsers, data];
      });
    });

    socket.on("userOffline", (data) => {
      console.log("🔴 Користувач офлайн:", data);
      setUsers((prevUsers) => prevUsers.filter((user) => user.userId !== data.userId));
    });

    return () => socket.disconnect();
  }, []);

  const fetchChatHistory = async (userId) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${userId}/65f8b2a7a3d5a26f6b9c1e12`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("❌ Помилка отримання історії повідомлень:", error);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchChatHistory(user.userId);
  };

  const sendMessage = () => {
    if (message.trim() === "" || !selectedUser) return;
    const newMessage = {
      sender: "65f8b2a7a3d5a26f6b9c1e12",
      receiver: selectedUser.userId,
      text: message,
    };

    socket.emit("sendMessage", newMessage); 

    setMessages((prev) => [...prev, newMessage]); 
    setMessage("");
  };

  return (
    <div>
      <h1>Чат</h1>
      {!token && <button onClick={login}>🔑 Увійти</button>}

      <h2>🟢 Онлайн користувачі:</h2>
      <ul>
        {users.map((user) => (
          <li
            key={user.userId}
            style={{
              cursor: "pointer",
              fontWeight: selectedUser?.userId === user.userId ? "bold" : "normal",
            }}
            onClick={() => handleSelectUser(user)}
          >
            {user.username}
          </li>
        ))}
      </ul>

      {selectedUser && <h3>💬 Чат з {selectedUser.username}</h3>}

      <h2>📩 Повідомлення:</h2>
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
      <button onClick={sendMessage} disabled={!selectedUser}>
        Надіслати
      </button>
    </div>
  );
}

export default App;
