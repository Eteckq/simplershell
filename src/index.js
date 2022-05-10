const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const TCPServer = require("./tcp");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");

const portTCP = process.env.PORT_TCP || 1337;
const portHTTP = process.env.PORT_HTTP || 3000;
const serverAddress = process.env.SERVER_ADDRESS || "127.0.0.1";

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(favicon(path.join(__dirname, "../favicon.ico")));


const httpServer = createServer(app);
const io = new Server(httpServer);

var tcpServer = new TCPServer(portTCP, io);

// WEBSITE

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

app.get("/:id", function (req, res) {
  let id = req.params.id;
  if (tcpServer) {
    let socket = tcpServer.shells.find((s) => s.id == id);
    if (!socket) {
      res.redirect("/");
      return;
    }
    if (socket.isTty) res.sendFile(path.join(__dirname, "../views/shell.html"));
    else res.sendFile(path.join(__dirname, "../views/shell-basic.html"));
  } else {
    res.redirect("/");
  }
});

// app.post("/:id/upload", function (req, res) {
//   let id = req.params.id;

//   if(!tcpServer) return
//   let shell = tcpServer.shells.find((s) => s.id == id)

//   console.log(req.body);
//   res.send('ok')
// });

// SOCKET IO

io.on("connection", (socket) => {
  socket.on("delete", (id) => {
    tcpServer.deleteTcpShell(id);
  });
  socket.on("state", (state) => {
    if (!tcpServer) {
      tcpServer = new TCPServer(portTCP, io);
    } else {
      tcpServer.destroy();
      tcpServer = null;
    }
    io.emit("state", { state: !!tcpServer, ip: `${serverAddress}:${portTCP}` });
  });
  if (tcpServer) {
    socket.emit("state", {
      state: true,
      ip: `${serverAddress}:${tcpServer.server.address().port}`,
    });
    socket.emit("shells", tcpServer.getSendableShells());
  } else socket.emit("state", { state: false, ip: `Ready on port ${portTCP}` });
});

httpServer.listen(portHTTP, () => {
  console.log(`HTTP: ${portHTTP}`);
});
