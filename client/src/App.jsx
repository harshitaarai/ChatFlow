import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Login from "./Login";
import "./App.css";

const API_URL = "http://localhost:5001";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("chatflowUser")
  );

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("general");
  const [rooms, setRooms] = useState([]);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);

  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const [appError, setAppError] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomError, setRoomError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("chatflowUser") || "null"
  );

  const currentRoomRef = useRef(currentRoom);
  const messagesEndRef = useRef(null);

  const onlineUsers = users.filter(
    (user) => user.status === "online"
  );

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Load rooms
  useEffect(() => {
    if (!isLoggedIn) return;

    setRoomsLoading(true);

    fetch(`${API_URL}/api/rooms`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load rooms");
        }

        return response.json();
      })
      .then((data) => {
        setRooms(data);
        setAppError("");

        if (data.length > 0) {
          setCurrentRoom((previousRoom) => {
            return previousRoom || data[0].name;
          });
        }
      })
      .catch((error) => {
        console.error(error);
        setAppError(
          "Unable to connect to the ChatFlow server."
        );
      })
      .finally(() => {
        setRoomsLoading(false);
      });
  }, [isLoggedIn]);

  // Socket connection
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.username) {
      return;
    }

    const newSocket = io(API_URL, {
      auth: {
        username: currentUser.username,
      },
    });

    newSocket.on("connect", () => {
      console.log(
        "Connected to ChatFlow server:",
        newSocket.id
      );
      setAppError("");
    });

    newSocket.on("receive_message", (newMessage) => {
      if (
        newMessage.room ===
        currentRoomRef.current
      ) {
        setMessages((previousMessages) => [
          ...previousMessages,
          newMessage,
        ]);
      }
    });

    newSocket.on(
      "user_status_changed",
      ({ username, status }) => {
        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user.username === username
              ? { ...user, status }
              : user
          )
        );
      }
    );

    newSocket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );

      setAppError(
        "Connection to ChatFlow server failed."
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isLoggedIn, currentUser?.username]);

  // Join selected Socket.IO room
  useEffect(() => {
    if (!socket || !currentRoom) return;

    socket.emit("join_room", currentRoom);

    console.log(
      `Joined ChatFlow room: ${currentRoom}`
    );
  }, [socket, currentRoom]);

  // Load room messages
  useEffect(() => {
    if (!isLoggedIn || !currentRoom) return;

    setMessages([]);
    setMessagesLoading(true);

    fetch(
      `${API_URL}/api/messages/${encodeURIComponent(
        currentRoom
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        return response.json();
      })
      .then((data) => {
        setMessages(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setMessagesLoading(false);
      });
  }, [isLoggedIn, currentRoom]);

  // Load users
  useEffect(() => {
    if (!isLoggedIn) return;

    setUsersLoading(true);

    fetch(`${API_URL}/api/auth/users`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load users");
        }

        return response.json();
      })
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setUsersLoading(false);
      });
  }, [isLoggedIn]);

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!message.trim()) return;
    if (!currentRoom) return;
    if (!socket) return;

    socket.emit("send_message", {
      room: currentRoom,
      sender: currentUser?.username,
      text: message.trim(),
    });

    setMessage("");
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();

    const trimmedName = newRoomName
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    if (!trimmedName) {
      setRoomError("Enter a room name");
      return;
    }

    if (!/^[a-z0-9-_]+$/.test(trimmedName)) {
      setRoomError(
        "Use letters, numbers, hyphens or underscores"
      );
      return;
    }

    try {
      setRoomError("");

      const response = await fetch(
        `${API_URL}/api/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create room"
        );
      }

      setRooms((previousRooms) => [
        ...previousRooms,
        data,
      ]);

      setCurrentRoom(data.name);
      setNewRoomName("");
      setShowCreateRoom(false);
    } catch (error) {
      setRoomError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatflowUser");

    if (socket) {
      socket.disconnect();
    }

    setSocket(null);
    setMessages([]);
    setRooms([]);
    setCurrentRoom("");
    setUsers([]);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>ChatFlow</h1>
        </div>

        <div className="user-card">
          <div className="avatar">
            {currentUser?.username
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {currentUser?.username}
            </strong>

            <span className="online">
              ● Online
            </span>
          </div>
        </div>

        <div className="rooms-section">
          <div className="rooms-title">
            <h2>Rooms</h2>

            <button
              className="create-room-button"
              onClick={() => {
                setShowCreateRoom(
                  !showCreateRoom
                );
                setRoomError("");
              }}
              title="Create room"
            >
              +
            </button>
          </div>

          {showCreateRoom && (
            <form
              className="create-room-form"
              onSubmit={handleCreateRoom}
            >
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(event) =>
                  setNewRoomName(
                    event.target.value
                  )
                }
                autoFocus
              />

              <button type="submit">
                Create
              </button>

              {roomError && (
                <span className="room-error">
                  {roomError}
                </span>
              )}
            </form>
          )}

          <div className="rooms">
            {roomsLoading ? (
              <p className="loading-text">
                Loading rooms...
              </p>
            ) : rooms.length === 0 ? (
              <p className="loading-text">
                No rooms available
              </p>
            ) : (
              rooms.map((room) => (
                <button
                  key={room._id}
                  className={`room ${
                    currentRoom === room.name
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentRoom(room.name)
                  }
                >
                  <span>#</span>
                  {room.name}
                </button>
              ))
            )}
          </div>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div>
            <h1>
              # {currentRoom}
            </h1>

            <p>
              Welcome to the {currentRoom} room
            </p>
          </div>

          <div className="members">
            <span className="member-dot"></span>
            {onlineUsers.length} online
          </div>
        </header>

        {appError && (
          <div className="connection-error">
            {appError}
          </div>
        )}

        <section className="messages">
          {messagesLoading ? (
            <div className="empty-chat">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">
              <h2>
                # {currentRoom}
              </h2>

              <p>
                No messages yet. Start the
                conversation.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                className={`message ${
                  msg.sender ===
                  currentUser?.username
                    ? "own"
                    : ""
                }`}
                key={
                  msg._id ||
                  msg.id ||
                  index
                }
              >
                <div className="message-avatar green">
                  {msg.sender
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div className="message-content">
                  <div className="message-info">
                    <strong>
                      {msg.sender}
                    </strong>

                    <span>
                      {new Date(
                        msg.time ||
                          msg.createdAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <p>{msg.text}</p>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </section>

        <form
          className="message-form"
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={!message.trim()}
          >
            Send
          </button>
        </form>
      </main>

      <aside className="members-panel">
        <h2>Members</h2>

        {usersLoading ? (
          <p className="loading-text">
            Loading members...
          </p>
        ) : users.length === 0 ? (
          <p className="loading-text">
            No members yet
          </p>
        ) : (
          users.map((user) => (
            <div
              className="member"
              key={user._id}
            >
              <div className="member-avatar green">
                {user.username
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {user.username}
                </strong>

                <span
                  className={
                    user.status === "online"
                      ? "online"
                      : ""
                  }
                >
                  {user.status}
                </span>
              </div>
            </div>
          ))
        )}
      </aside>
    </div>
  );
}

export default App;