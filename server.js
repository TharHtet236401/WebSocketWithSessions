const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { cpSync } = require("fs");
const formatMessage = require("./utils/messages");
const {userJoin ,getCurrentUser,userLeave,getRoomUsers} = require("./utils/users");

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);
const io = socketio(server);
const botName = "ChatBot"; 

app.use(express.static(path.join(__dirname, "public")));

io.on('connection', (socket) => {
  
  socket.on('joinRoom',({username,room})=>{

    const user = userJoin(socket.id,username,room);
    socket.join(user.room);
    

    socket.emit('message', formatMessage(botName, 'Welcome to the chat'));

    socket.broadcast.to(user.room).emit(
      'message', formatMessage(botName, `${user.username} has joined the chat`));

    io.to(user.room).emit('roomUsers',{
      room: user.room,
      users: getRoomUsers(user.room)
    })


    socket.on('typing', () => {
      socket.broadcast.to(user.room).emit(
        'typing', formatMessage(user.username, `is typing...`));
  });

  socket.on('stop typing', () => {
      socket.broadcast.to(user.room).emit(
        'stop typing', formatMessage(user.username, `stopped typing`));
  });
  })
  

  

  //listent the chatMessage
  socket.on('chatMessage',(msg)=>{
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  })

  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if(user){
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has disconnected`));

      io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
      })


    }
    
    
   
    
  });
  



});

   


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});