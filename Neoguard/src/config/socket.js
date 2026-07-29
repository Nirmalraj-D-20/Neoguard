let io = null;

// 🔹 Initialize Socket.IO (Singleton)
const initSocket = (server) => {
  if (io) {
    console.warn("⚠️ Socket already initialized");
    return io;
  }

  io = require("socket.io")(server, {
    cors: {
      origin: "*", // 🔴 IMPORTANT: restrict in production
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"], // fallback safety
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // ✅ Basic connectivity test
    socket.emit("test", { msg: "Socket working ✅" });

    // 🔥 Join device-specific room
    socket.on("joinDevice", (device_id) => {
      try {
        if (typeof device_id !== "string" || device_id.trim() === "") {
          console.warn(`⚠️ Invalid device_id from ${socket.id}`);
          return;
        }

        device_id = device_id.trim();

        // Prevent redundant joins
        if (!socket.rooms.has(device_id)) {
          socket.join(device_id);
        }

        const room = io.sockets.adapter.rooms.get(device_id);
        const roomSize = room ? room.size : 0;

        console.log(`📡 ${socket.id} joined ${device_id} | size: ${roomSize}`);
      } catch (err) {
        console.error(`🚨 joinDevice error (${socket.id}):`, err.message);
      }
    });

    // 🔥 Leave device room
    socket.on("leaveDevice", (device_id) => {
      try {
        if (typeof device_id !== "string") return;

        socket.leave(device_id);

        const room = io.sockets.adapter.rooms.get(device_id);
        const roomSize = room ? room.size : 0;

        console.log(`📡 ${socket.id} left ${device_id} | size: ${roomSize}`);
      } catch (err) {
        console.error(`🚨 leaveDevice error (${socket.id}):`, err.message);
      }
    });

    // 🔌 Disconnect
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} | ${reason}`);
    });

    // 🚨 Error handling
    socket.on("error", (err) => {
      console.error(`🚨 Socket error (${socket.id}):`, err.message);
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
};

// 🔹 Get Socket Instance
const getIO = () => {
  if (!io) {
    throw new Error("❌ Socket.io not initialized. Call initSocket(server) first.");
  }
  return io;
};

// 🔹 OPTIONAL: Emit helper (recommended for scaling)
const emitToDevice = (device_id, event, payload) => {
  if (!io) {
    throw new Error("❌ Socket.io not initialized.");
  }

  if (!device_id) {
    console.warn("⚠️ emitToDevice called without device_id");
    return;
  }

  io.to(device_id).emit(event, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToDevice // 🔥 optional but powerful
};