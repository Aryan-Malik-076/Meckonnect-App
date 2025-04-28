// D:\Projects\Code\MecKoonect Web\She-Cab\She-Cab\backend\server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import { Server } from "socket.io";
import http from "http";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Allow all origins for development
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/admin", adminRoutes);

// Socket.io Real-Time Tracking
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("updateLocation", (data) => {
    io.emit("driverLocationUpdate", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Error Handling for Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});