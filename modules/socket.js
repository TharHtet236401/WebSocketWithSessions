const socketio = require("socket.io");
const formatMessage = require("../utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("../utils/users");
const User = require('../models/User');
const Message = require('../models/Message');

const botName = "ChatBot";

function initializeSocket(server) {
  const io = socketio(server);

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // Save user info to MongoDB
      const newUser = new User({
        username: user.username,
        room: user.room,
        socketId: user.id,
      });

      try {
        await newUser.save();
      } catch (err) {
        console.error('Error saving user to database:', err);
      }

      socket.emit('message', formatMessage(botName, 'Welcome to the chat'));
      let roomMessages = [];
      let savedUser;

      // Retrieve and send previous messages for the room
      try {
        roomMessages = await Message.find({ room: user.room }).sort({ timestamp: 1 });
        roomMessages.forEach(message => {
          socket.emit('message', formatMessage(message.user, message.message));
        });
      } catch (err) {
        console.error('Error retrieving messages from database:', err);
      }

      // Broadcast that a user has joined the room
      try {
        savedUser = await User.findOne({ socketId: socket.id });
        if (savedUser) {
          socket.broadcast.to(savedUser.room).emit(
            'message', formatMessage(botName, `${savedUser.username} has joined the chat`)
          );
        }
      } catch (err) {
        console.error('Error retrieving user from database:', err);
      }

      io.to(savedUser.room).emit('roomUsers', {
        room: savedUser.room,
        users: getRoomUsers(savedUser.room)
      });

      socket.on('typing', () => {
        socket.broadcast.to(savedUser.room).emit(
          'typing', formatMessage(savedUser.username, `is typing...`)
        );
      });

      socket.on('stop typing', () => {
        socket.broadcast.to(savedUser.room).emit(
          'stop typing', formatMessage(savedUser.username, `stopped typing`)
        );
      });
    });

    socket.on('chatMessage', async (msg) => {
      const user = getCurrentUser(socket.id);
      const newMessage = new Message({
        user: user.username, // Use user instead of savedUser
        message: msg,
        room: user.room, // Use user instead of savedUser
        image: null, // Handle image if needed
        video: null, // Handle video if needed
      });

      try {
        await newMessage.save();
        io.to(user.room).emit('message', formatMessage(user.username, msg));
      } catch (err) {
        console.error('Error saving message to database:', err);
      }
    });

    socket.on('disconnect', async () => {
      const user = userLeave(socket.id);

      if (user) {
        // Retrieve the username from the database
        try {
          const savedUser = await User.findOne({ socketId: socket.id });
          if (savedUser) {
            io.to(user.room).emit(
              'message', formatMessage(botName, `${savedUser.username} has disconnected`)
            );
          }
        } catch (err) {
          console.error('Error retrieving user from database:', err);
        }

        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });

        // Remove user from MongoDB
        try {
          await User.findOneAndDelete({ socketId: socket.id });
        } catch (err) {
          console.error('Error removing user from database:', err);
        }
      }
    });
  });
}

module.exports = initializeSocket;