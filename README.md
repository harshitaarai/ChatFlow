# ChatFlow

ChatFlow is a full-stack real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB.

The application supports user authentication, real-time messaging, multiple chat rooms, persistent message history, and online/offline user presence.

## Features

- User registration and login
- Password hashing with bcrypt
- MongoDB Atlas database
- Real-time messaging with Socket.IO
- Multiple chat rooms
- Dynamic room creation
- Persistent message history
- Room-specific message history
- Online/offline user status
- Multi-tab presence tracking
- Dynamic member list
- Logout functionality
- Loading and connection error states
- Polished responsive chat interface

## Tech Stack

### Frontend

- React
- Vite
- CSS
- Socket.IO Client

### Backend

- Node.js
- Express
- Socket.IO
- Mongoose
- bcrypt
- CORS
- dotenv

### Database

- MongoDB Atlas

## Project Structure

```text
ChatFlow/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Login.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   └── Message.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   └── messages.js
│   │
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md