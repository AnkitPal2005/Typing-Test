/* eslint-disable @typescript-eslint/no-require-imports */

const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

if (!Number.isFinite(port)) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const dev = process.env.NODE_ENV === 'development';
const app = next({ dev });
const handle = app.getRequestHandler();
const rooms = new Map();

function normalizeRoomId(roomId) {
  return typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
}

function normalizeUsername(username) {
  return typeof username === 'string' && username.trim() ? username.trim() : 'Guest';
}

async function main() {
  await app.prepare();

  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error('Next.js request handler failed:', error);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal server error');
      }
    });
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('create-room', ({ username, words } = {}) => {
      if (!Array.isArray(words) || words.length === 0) {
        socket.emit('error-msg', 'Could not create room without words.');
        return;
      }

      const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
      const room = {
        id: roomId,
        words,
        players: [
          {
            id: socket.id,
            username: normalizeUsername(username),
            typedCount: 0,
            wpm: 0,
            accuracy: 100,
            isFinished: false,
          },
        ],
        status: 'waiting',
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room-created', { roomId, words });
      io.to(roomId).emit('update-players', room.players);
    });

    socket.on('join-room', ({ roomId, username } = {}) => {
      const normalizedRoomId = normalizeRoomId(roomId);
      const room = rooms.get(normalizedRoomId);

      if (!room) {
        socket.emit('error-msg', 'Room not found.');
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error-msg', 'Race already started.');
        return;
      }

      room.players.push({
        id: socket.id,
        username: normalizeUsername(username),
        typedCount: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      });

      socket.join(room.id);
      socket.emit('room-joined', { roomId: room.id, words: room.words });
      io.to(room.id).emit('update-players', room.players);
    });

    socket.on('start-race', ({ roomId } = {}) => {
      const room = rooms.get(normalizeRoomId(roomId));
      if (!room || room.status !== 'waiting') return;

      room.status = 'starting';
      io.to(room.id).emit('race-starting');

      let count = 3;
      const interval = setInterval(() => {
        io.to(room.id).emit('countdown', count);
        count -= 1;

        if (count < 0) {
          clearInterval(interval);
          room.status = 'running';
          io.to(room.id).emit('race-started');
        }
      }, 1000);
    });

    socket.on('update-progress', ({ roomId, typedCount, wpm, accuracy } = {}) => {
      const room = rooms.get(normalizeRoomId(roomId));
      if (!room || !Array.isArray(room.words)) return;

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player || player.isFinished) return;

      player.typedCount = Number.isFinite(typedCount) ? typedCount : player.typedCount;
      player.wpm = Number.isFinite(wpm) ? wpm : player.wpm;
      player.accuracy = Number.isFinite(accuracy) ? accuracy : player.accuracy;

      const totalChars = room.words.join(' ').length;
      if (player.typedCount >= totalChars) {
        player.isFinished = true;
      }

      io.to(room.id).emit('update-players', room.players);

      if (room.players.length > 0 && room.players.every((entry) => entry.isFinished)) {
        room.status = 'finished';
        const winner = [...room.players].sort((a, b) => b.wpm - a.wpm)[0];
        io.to(room.id).emit('race-finished', winner.username);
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex((entry) => entry.id === socket.id);

        if (playerIndex === -1) {
          continue;
        }

        room.players.splice(playerIndex, 1);
        io.to(room.id).emit('update-players', room.players);

        if (room.players.length === 0) {
          rooms.delete(roomId);
        }

        break;
      }
    });
  });

  server.on('error', (error) => {
    console.error('HTTP server failed:', error);
    process.exit(1);
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (${dev ? 'development' : 'production'})`);
  });
}

main().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
