// Singleton wrapper around the Socket.IO server so any controller can emit
// without re-importing the http server.

let io = null;

function init(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || '*' },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Clients can subscribe to a specific salon + date room to receive
    // booking:created events only relevant to the slot picker they're on.
    socket.on('subscribe', ({ salon, date }) => {
      if (salon && date) socket.join(`slots:${salon}:${date}`);
    });
    socket.on('unsubscribe', ({ salon, date }) => {
      if (salon && date) socket.leave(`slots:${salon}:${date}`);
    });
  });

  console.log('\x1b[32m[socket] Socket.IO listening\x1b[0m');
  return io;
}

function emitBookingCreated(booking) {
  if (!io) return;
  const room = `slots:${booking.salon}:${booking.date}`;
  io.to(room).emit('booking:created', {
    salon: String(booking.salon),
    date: booking.date,
    time: booking.time,
    reference: booking.reference,
  });
  // Also fire a global event for admin dashboards.
  io.emit('admin:booking', { reference: booking.reference, createdAt: booking.createdAt });
}

function emitBookingCancelled(booking) {
  if (!io) return;
  const room = `slots:${booking.salon}:${booking.date}`;
  io.to(room).emit('booking:cancelled', {
    salon: String(booking.salon),
    date: booking.date,
    time: booking.time,
    reference: booking.reference,
  });
}

module.exports = { init, emitBookingCreated, emitBookingCancelled };
