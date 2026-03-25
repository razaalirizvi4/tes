import http from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3002', // Allow Next.js frontend
      methods: ['GET', 'POST'],
    },
    // transports: ['websocket'], // Only use WebSocket transport (instead of polling)
  });

  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('A client disconnected:', socket.id);
    });

    socket.on('order-status-updated', (updatedOrder) => {
      console.log('Order status updated:', updatedOrder);
      io.emit('order-status-changed', updatedOrder);
    });
  });

  server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});