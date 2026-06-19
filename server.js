const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    socket.on('create-room', ({ username, words }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = {
        id: roomId,
        words,
        players: [{ id: socket.id, username, typedCount: 0, wpm: 0, accuracy: 100, isFinished: false }],
        status: 'waiting'
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room-created', { roomId, words });
      io.to(roomId).emit('update-players', room.players);
    });

    socket.on('join-room', ({ roomId, username }) => {
      const room = rooms.get(roomId?.toUpperCase());
      if (!room) {
        socket.emit('error-msg', 'Room not found.');
        return;
      }
      if (room.status !== 'waiting') {
        socket.emit('error-msg', 'Race already started.');
        return;
      }

      room.players.push({ id: socket.id, username, typedCount: 0, wpm: 0, accuracy: 100, isFinished: false });
      socket.join(roomId.toUpperCase());
      socket.emit('room-joined', { roomId: room.id, words: room.words });
      io.to(room.id).emit('update-players', room.players);
    });

    socket.on('start-race', ({ roomId }) => {
      const room = rooms.get(roomId?.toUpperCase());
      if (!room) return;

      room.status = 'starting';
      io.to(room.id).emit('race-starting');

      let count = 3;
      const interval = setInterval(() => {
        io.to(room.id).emit('countdown', count);
        count--;
        if (count < 0) {
          clearInterval(interval);
          room.status = 'running';
          io.to(room.id).emit('race-started');
        }
      }, 1000);
    });

    socket.on('update-progress', ({ roomId, typedCount, wpm, accuracy }) => {
      const room = rooms.get(roomId?.toUpperCase());
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player && !player.isFinished) {
        player.typedCount = typedCount;
        player.wpm = wpm;
        player.accuracy = accuracy;

        const totalChars = room.words.join(' ').length;
        if (typedCount >= totalChars) {
          player.isFinished = true;
        }

        io.to(room.id).emit('update-players', room.players);

        if (room.players.every(p => p.isFinished)) {
          room.status = 'finished';
          const winner = [...room.players].sort((a, b) => b.wpm - a.wpm)[0];
          io.to(room.id).emit('race-finished', winner.username);
        }
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          io.to(room.id).emit('update-players', room.players);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
