const http = require("http");

const host = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  const body = {
    service: "backend",
    status: "ok",
    path: req.url,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
});

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
