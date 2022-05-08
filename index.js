const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const TCPServer = require("./tcp");
var favicon = require('serve-favicon')
var bodyParser = require('body-parser')


const portTCP = process.env.PORT_TCP || 1337;
const portHTTP = process.env.PORT_HTTP || 3000;

const app = express();
app.use( bodyParser.json() );     
app.use(bodyParser.urlencoded({  
  extended: true
})); 
app.use(favicon(path.join(__dirname, 'favicon.ico')))
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

var tcpServer = new TCPServer(portTCP, io)

// WEBSITE

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/:id", function (req, res) {
  let id = req.params.id;
  if (tcpServer && tcpServer.shells.find((s) => s.id == id)) {
    res.sendFile(path.join(__dirname, "/shell.html"));
  } else {
    res.redirect("/");
  }
});

app.post("/:id/upload", function (req, res) {
  let id = req.params.id;

  if(!tcpServer) return
  let shell = tcpServer.shells.find((s) => s.id == id)
  if (shell) {
    shell.write(
      Buffer.from(`echo '${req.body.file}' | base64 --decode > ${req.body.filename}\n`)
    );
    res.send("ok");
  } else {
    res.send("Shell id Not Found");
  }

  
});


// SOCKET IO

io.on("connection", (socket) => {
  socket.on('delete', id =>{
    tcpServer.deleteTcpShell(id)
  })
  socket.on('state', state => {
      if(!tcpServer){
        tcpServer = new TCPServer(portTCP, io);
      } else {
        tcpServer.destroy()
        tcpServer = null
      }
      io.emit("state", !!tcpServer);
  })
  if (tcpServer) {
    socket.emit("state", true);
    socket.emit("shells", tcpServer.getSendableShells());
  } else socket.emit("state", false);
});

httpServer.listen(portHTTP);

console.log(`HTTP: ${portHTTP}`);
