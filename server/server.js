const cors = require('cors');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods:["GET","POST"],
    }
});

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')
const router = require('./router');

app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });        

        if(error) return callback('error');

        socket.emit('message', {user: 'admin', text: `${user.name}, welcom to the room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
    
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { user: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        
        if(user) {
            io.to(user.room).emit('message', { user: 'admin', text:`${user.name} has left` })
        }
    })
});

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`linstening on port ${PORT}`));


