require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { getStockPrice } = require('./src/services/stockService');
const { checkPriceAlerts } = require('./src/services/alertService');
const { normalizeSymbol } = require('./src/utils/symbolNormalizer');
const jwt = require('jsonwebtoken');
const allowedOrigins = require('./src/config/allowedOrigins');

const PORT = process.env.PORT || 5000;

// Wrap express app in HTTP server
const server = http.createServer(app);

// Production Socket.io CORS setup
const io = new Server(server, {
  cors: {
    origin: [...allowedOrigins],
    methods: ['GET', 'POST'],
  },
});

// Attach io to app for access in routes/controllers
app.set('io', io);

// Global active symbols pool subscribed by connected clients or defaults
const defaultSymbols = new Set(['AAPL', 'RELIANCE', 'TCS', 'MSFT', 'INFY', 'TSLA', 'AMZN'].map((symbol) => normalizeSymbol(symbol).normalizedSymbol));
const socketSubscriptions = new Map(); // socket.id -> Set of symbols

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = String(decoded.id);
    return next();
  } catch (error) {
    return next(new Error('Invalid or expired authentication token'));
  }
});

const getActiveSymbols = () => {
  const active = new Set(defaultSymbols);
  for (const symSet of socketSubscriptions.values()) {
    for (const sym of symSet) {
      active.add(sym);
    }
  }
  return Array.from(active);
};

// Client socket connection & subscription handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  socket.join(`user:${socket.data.userId}`);
  socketSubscriptions.set(socket.id, new Set());

  // Subscribe to specific stock symbols
  socket.on('subscribe:symbols', (symbols) => {
    if (Array.isArray(symbols)) {
      const clientSet = socketSubscriptions.get(socket.id) || new Set();
      symbols.slice(0, 100).forEach((sym) => {
        if (typeof sym === 'string' && sym.trim()) {
          const norm = normalizeSymbol(sym.trim());
          if (norm.normalizedSymbol) {
            clientSet.add(norm.normalizedSymbol);
            socket.join(`user:${socket.data.userId}:symbol:${norm.normalizedSymbol}`);
          }
        }
      });
      socketSubscriptions.set(socket.id, clientSet);
      console.log(`📡 Socket ${socket.id} subscribed to:`, Array.from(clientSet));
    }
  });

  // Unsubscribe from symbols
  socket.on('unsubscribe:symbols', (symbols) => {
    if (Array.isArray(symbols)) {
      const clientSet = socketSubscriptions.get(socket.id);
      if (clientSet) {
        symbols.forEach((sym) => {
          if (typeof sym === 'string' && sym.trim()) {
            const norm = normalizeSymbol(sym.trim());
            clientSet.delete(norm.normalizedSymbol);
            socket.leave(`user:${socket.data.userId}:symbol:${norm.normalizedSymbol}`);
          }
        });
      }
    }
  });

  socket.on('disconnect', () => {
    socketSubscriptions.delete(socket.id);
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Backend polling loop: fetches cached/live quote and broadcasts to subscribed clients
const sendStockUpdates = async () => {
  const activeSymbols = getActiveSymbols();
  for (const symbol of activeSymbols) {
    try {
      const stockData = await getStockPrice(symbol);

      if (stockData && stockData.currentPrice > 0 && stockData.dataSource !== 'demo') {
        const canonicalSymbol = stockData.fullSymbol || normalizeSymbol(symbol).normalizedSymbol;
        const recipients = new Set();
        for (const [socketId, subscriptions] of socketSubscriptions.entries()) {
          if (subscriptions.has(canonicalSymbol)) {
            const connectedSocket = io.sockets.sockets.get(socketId);
            if (connectedSocket) recipients.add(connectedSocket.data.userId);
          }
        }
        recipients.forEach((userId) => {
          io.to(`user:${userId}:symbol:${canonicalSymbol}`).emit('priceUpdate', stockData);
        });
        console.log(`📡 Broadcast update for ${symbol}: ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.currentPrice} (${stockData.dataSource})`);

        // Check active price alerts for this stock
        await checkPriceAlerts(stockData, io);
      }
    } catch (error) {
      console.error(`❌ Failed background update for ${symbol}:`, error.message);
    }
  }
};

// Periodic polling every 3 minutes (respects API limits and cache)
setInterval(sendStockUpdates, 3 * 60 * 1000);

// Connect DB & Start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('⚡ Socket.io ready for pooled real-time market updates and alerts');
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
