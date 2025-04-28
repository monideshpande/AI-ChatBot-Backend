// Import dependencies
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Import custom modules
import connectDB from './config/db_connection.js';
import APIRoutes from './Routes/APIRoutes.js';


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create app and server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Gemini API handler
const callGeminiAPI = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: message }]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return { message: aiText || "🤖 Gemini didn't return any text." };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error('Gemini API Error:', errorMessage);
    return { message: `Gemini API error: ${errorMessage}` };
  }
};

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('send_message', async ({ message, userId }) => {
    console.log("🟢 Message received:", message);
    console.log("👤 From user ID:", userId);

    const result = await callGeminiAPI(message);

    socket.emit('receive_message', { sender: 'ai', message: result.message });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/auth", APIRoutes);

app.get("/", (req, res) => {
  res.send("yeah ! Backend is working");
});


// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
 
});
