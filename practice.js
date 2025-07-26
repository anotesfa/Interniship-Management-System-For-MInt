const http = require('http');

const server = http.createServer((req, res) => {
    console.log(req);
    res.end("Hello guys, I've come");
  
});

server.listen(3000, '127.0.0.1', () => {
  console.log("This is from server");
});
ffhgf