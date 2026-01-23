const term = new Terminal({
  cursorBlink: true,
  fontSize: 15,
  theme: {
    background: "#050f0a",
    foreground: "#33ff66",
    cursor: "#66ff99"
  }
});

term.open(document.getElementById("terminal"));

/* ---------- BOOT SEQUENCE ---------- */

const bootLines = [
  "[    0.000000] Linux version 6.1.0-pipboy",
  "[    0.231991] Initializing kernel modules",
  "[    0.611902] Radiation sensors online",
  "[    1.021889] EXT4-fs mounted",
  "[    1.467220] Starting terminal services",
  ""
];

let i = 0;
const boot = setInterval(() => {
  term.writeln(bootLines[i++]);
  if (i === bootLines.length) {
    clearInterval(boot);
    connectBackend();
  }
}, 80);

/* ---------- CONNECT DOCKER ---------- */

function connectBackend() {
  term.writeln("Connecting to secure shell...");
  const socket = new WebSocket("ws://localhost:9080");

  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    term.writeln("Connected. Welcome to Ubuntu.");
  };

  socket.onmessage = e => {
    term.write(new TextDecoder().decode(e.data));
  };

  term.onData(data => {
    socket.send(data);
  });

  socket.onclose = () => {
    term.writeln("\r\n[ CONNECTION CLOSED ]");
  };
}
