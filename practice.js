const http = require('http');

const server = http.createServer((req, res) => {
  res.end("Hello guys I'm come");
  <h1>Heyyyyyy</h1>
});

server.listen(8000, '127.0.0.1', () => {
  console.log("This is from server");
});
