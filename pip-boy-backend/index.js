import { WebSocketServer } from "ws";
import Docker from "dockerode";

const docker = new Docker();
const wss = new WebSocketServer({ port: 9080 });

console.log("🚀 WebSocket server running on ws://localhost:9080");

wss.on("connection", async ws => {
  console.log("🧪 New terminal session");

  let container;
  let shuttingDown = false;

  try {
    container = await docker.createContainer({
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

    // ---------------- Docker → Browser ----------------
    stream.on("data", chunk => {
      if (ws.readyState === ws.OPEN) {
        ws.send(chunk);
      }
    });

    // ---------------- Browser → Docker ----------------
    ws.on("message", msg => {
      if (!shuttingDown) {
        stream.write(Buffer.from(msg));
      }
    });

    // ---------------- Detect container exit ----------------
    container.wait().then(() => {
      if (ws.readyState === ws.OPEN) {
        shuttingDown = true;

        ws.send(JSON.stringify({
          type: "SYSTEM_SHUTDOWN",
          reason: "CONTAINER_EXIT"
        }));

        ws.close();
      }
    });

    // ---------------- WebSocket closed by client ----------------
    ws.on("close", async () => {
      shuttingDown = true;
      try {
        await container.kill();
      } catch {}
    });

  } catch (err) {
    console.error("❌ Session error:", err);

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: "SYSTEM_SHUTDOWN",
        reason: "BACKEND_ERROR"
      }));
      ws.close();
    }

    if (container) {
      try {
        await container.kill();
      } catch {}
    }
  }
});
