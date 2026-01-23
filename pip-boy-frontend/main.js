// ---------------- TERMINAL SETUP ----------------

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

// ---------------- STATE ----------------

let stage = "robco"; // robco → wait_start → linux → connected
let inputBuffer = "";
let socket;

// ---------------- ROBCO BOOT DATA ----------------

const messagesBeforeRobco = [
  "Initializing boot...",
  "Loading RobCo Unified OS...",
  "64K RAM detected...",
  "Launching Interface...",
  ""
];

const robcoAsciiArt = [
  "   _____       _      _____                   ",
  "  |  __ \\     | |    / ____|                  ",
  "  | |__) |___ | |__ | |      ___               ",
  "  |  _  // _ \\| '_ \\| |     / _ \\              ",
  "  | | \\ \\ (_) | |_) | |____| (_) |             ",
  "  |_|  \\_\\___/|___./ \\_____|\\___/              ",
  ""
];

const messagesAfterRobco = [
  "==============================================",
  "Personal Terminal 'Proto-Boy' Manufactured by RobCo",
  "Type start to continue:",
  ""
];

// ---------------- UTILS ----------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------- ROBCO BOOT SEQUENCE ----------------

async function playRobcoBoot() {
  for (const line of messagesBeforeRobco) {
    term.writeln(line);
    await sleep(120);
  }

  await sleep(300);

  for (const line of robcoAsciiArt) {
    term.writeln(line);
    await sleep(60);
  }

  await sleep(300);

  for (const line of messagesAfterRobco) {
    term.writeln(line);
    await sleep(80);
  }

  stage = "wait_start";
  term.write("> ");
}

// ---------------- LINUX BOOT ----------------

function startLinuxBoot() {
  stage = "linux";

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
}

// ---------------- BACKEND CONNECTION ----------------

function connectBackend() {
  term.writeln("Connecting to secure shell...");
  socket = new WebSocket("ws://localhost:9080");

  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    stage = "connected";
    term.writeln("Connected. Welcome to PipOS 3000.");
  };

  socket.onmessage = e => {
    term.write(new TextDecoder().decode(e.data));
  };

  socket.onclose = () => {
    term.writeln("\r\n[ CONNECTION CLOSED ]");
  };
}

// ---------------- INPUT HANDLING ----------------

term.onData(data => {
  const code = data.charCodeAt(0);

  // ENTER
  if (code === 13) {
    term.writeln("");

    if (stage === "wait_start") {
      if (inputBuffer.trim().toLowerCase() === "start") {
        inputBuffer = "";
        startLinuxBoot();
      } else {
        term.writeln("ERROR: INVALID COMMAND");
        term.write("> ");
        inputBuffer = "";
      }
      return;
    }

    if (stage === "connected") {
      socket.send("\r");
      return;
    }
    
  }

  // BACKSPACE
  if (code === 127) {
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      term.write("\b \b");
    }
    return;
  }

  // TYPING BEFORE BACKEND
  if (stage === "wait_start") {
    inputBuffer += data;
    term.write(data);
    return;
  }

  // NORMAL TERMINAL MODE
  if (stage === "connected") {
    socket.send(data);
  }
});

// ---------------- START ----------------

playRobcoBoot();

// const term = new Terminal({
//   cursorBlink: true,
//   fontSize: 15,
//   theme: {
//     background: "#050f0a",
//     foreground: "#33ff66",
//     cursor: "#66ff99"
//   }
// });

// term.open(document.getElementById("terminal"));

// /* ---------- BOOT SEQUENCE ---------- */

// const bootLines = [
//   "[    0.000000] Linux version 6.1.0-pipboy",
//   "[    0.231991] Initializing kernel modules",
//   "[    0.611902] Radiation sensors online",
//   "[    1.021889] EXT4-fs mounted",
//   "[    1.467220] Starting terminal services",
//   ""
// ];

// let i = 0;
// const boot = setInterval(() => {
//   term.writeln(bootLines[i++]);
//   if (i === bootLines.length) {
//     clearInterval(boot);
//     connectBackend();
//   }
// }, 80);

// /* ---------- CONNECT DOCKER ---------- */

// function connectBackend() {
//   term.writeln("Connecting to secure shell...");
//   const socket = new WebSocket("ws://localhost:9080");

//   socket.binaryType = "arraybuffer";

//   socket.onopen = () => {
//     term.writeln("Connected. Welcome to Ubuntu.");
//   };

//   socket.onmessage = e => {
//     term.write(new TextDecoder().decode(e.data));
//   };

//   term.onData(data => {
//     socket.send(data);
//   });

//   socket.onclose = () => {
//     term.writeln("\r\n[ CONNECTION CLOSED ]");
//   };
// }
