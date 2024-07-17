const express = require("express");
const path = require("path");
const http = require("http");
const initializeSocket = require("./modules/socket");

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "public")));

initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});