import { Server} from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      // this cors not use in production now you in development time
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });
  
  // jab jab new user connect tab tab this function was run
  io.on("connection", (socket) => {
    
    // this part check karta hai ki user na jis room jana chaha ta hai wo room hai ki na hai
    // nahi hai to ak new room create karo matlab kan new array create

    console.log("SOMETHING CONNECTED");
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id); // this line new array k and new user ko push karta hai
      timeOnline[socket.id] = new Date();

      // हाँ, इसका actual काम है सभी users को notify करना कि नया user join हुआ है
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path]
        );
      }
      // this part sab new user ko old chat veg ta hai
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      // → यह code बस पता करता है कि chat भेजने वाला user किस room में belong करता है।
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );
      // इसका काम है message save करना और room के सभी users को भेजना।
      if (found === true) {
        // अगर यह undefined है → room के लिए नया array बना दो
        if (messages[matchingRoom] == undefined) {
          messages[matchingRoom] = [];
        }
        // data save karta hai
        messages[matchingRoom].push({
          "sender": sender,
          "data": data,
          "socket-id-sender": socket.id,
        });
        console.log("message", matchingRoom, ":", sender, data);
        // Room के सभी users को real-time message भेजना
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });
    // User disconnect होता है
    socket.on("disconnect", () => {
      // Server check करता है कि user कितनी देर तक online था (diffTime)
      let diffTime = Math.abs(timeOnline[socket.id] - new Date());
      let key;
      //  Loop चलता है हर room में → पता लगाता है कि user किस room में था
      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] == socket.id) {
            key = k;
            // Room में सभी users को notify करता है → "user-left" event
            for (let a = 0; a < connections[key].length; a++) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }
            // Room की user list से user remove करता है
            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);
            // अगर room empty हो गया → room delete कर देता है
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });
  return io;
};
