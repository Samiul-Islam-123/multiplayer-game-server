const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketIO = require("socket.io");
const cors = require('cors')
app.use(cors());
const io = socketIO(server, {
  cors: {
    origin: "https://multiplayer-game-frontend.onrender.com",
    methods: ["GET", "POST"],
  },
});


var roomData = [{
  roomID: "",
  userX_name: "",
  userX_id: "",
  userO_name: "",
  userO_id: "",
  full: "false"
}]

app.get('/', (req, res) => {
  res.json({
    message: "Hellow World",
    success: true
  })
})

io.on("connection", (socket) => {
  console.log("New User connected");
  io.emit("welcome", "Welcome to our server, here is your ID : " + socket.id);

  //emiting userID
  socket.on('request-id', (username) => {
    socket.emit('id-response', socket.id);
  })



  socket.on('request-room-data', () => {
    socket.emit('room-data', rooms)
  })

  //event for creating a new room
  socket.on("create-room-req", (username) => {
    //adding user to the room
    socket.join(socket.id);
    roomData.push({
      roomID: socket.id,
      userX_name: username,
      userX_id: socket.id
    })
    //sending create room response
    const currentRoomData = roomData.find(data => data.roomID === socket.id);
    if (currentRoomData) {
      socket.emit("create-room-res", {
        roomData: currentRoomData,
        success: true
      });
    }

    else
      console.error("no mathching room data found");
  });

  //event for joining the room
  socket.on("join-room-request", (UserData) => {


    const currentRoomData = roomData.find(data => data.roomID === UserData.roomID);
    if (!currentRoomData.full) {
      socket.join(UserData.roomID);
      currentRoomData.userO_name = UserData.username;
      currentRoomData.userO_id = socket.id;
      currentRoomData.full = true;

      // Update roomData with the modified currentRoomData
      const updatedRoomData = roomData.map(data => {
        if (data.roomID === UserData.roomID) {
          return currentRoomData;
        }
        return data;
      });

      // Assign the updated roomData back to the original variable
      roomData = updatedRoomData;
      console.log("User Join");
      io.to(UserData.roomID).emit('join-room-response', {
        success: true,
        message: `${UserData.username} has joined to the room`
      })
    }

    else {
      console.log("filled :(")
      socket.emit('join-room-response', {
        success: false,
        message: `Sorry but the room is filled :(`
      })
    }
  });

  socket.on('request-roomData', roomID => {
    const currentRoomData = roomData.find(data => data.roomID === roomID);
    io.to(roomID).emit('response-roomData', currentRoomData);
  })

  socket.on("disconnect", () => {
    console.log(`User with ID ${socket.id} disconnected`);

    roomData.forEach((item, index) => {
      if (item.userX_id === socket.id || item.userO_id === socket.id) {
        console.log(item);
        // Remove the user from the roomData array
        roomData[index].full = false;
        roomData.splice(index, 1);
        console.log(`User removed from roomData`);
      }
    });
  });

});

const PORT = process.env.PORT || 5500;

server.listen(PORT, () => {
  console.log("Server is running on PORT : ", PORT);
});
