import { WebSocketServer } from "ws";
import Docker from "dockerode";

const docker = new Docker();
const wss = new WebSocketServer({ port: 9080 });

console.log("🚀 WebSocket server running on ws://localhost:9080");

wss.on("connection", async ws => {
  console.log("🧪 New terminal session");

  const container = await docker.createContainer({
    Image: "ubuntu:22.04",
    Cmd: ["/bin/bash"],
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    HostConfig: {
      AutoRemove: true
    }
  });

  await container.start();

  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    hijack: true
  });

  // Docker → Browser
  stream.on("data", chunk => {
    ws.send(chunk);
  });

  // Browser → Docker
  ws.on("message", msg => {
    stream.write(Buffer.from(msg));
  });

  ws.on("close", async () => {
    try {
      await container.kill();
    } catch {}
  });
});
