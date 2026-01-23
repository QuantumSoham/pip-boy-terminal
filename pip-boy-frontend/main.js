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

// robco → wait_start → linux → connected → shutdown
let stage = "robco";
let inputBuffer = "";
let socket;

// ---------------- ROBCO BOOT DATA ----------------

const messagesBeforeRobco = [
  "*************** PIP-OS(R) V7.1.0.8 ***************",
  "",
  "COPYRIGHT 2075 ROBCO(R)",
  "LOADER V1.1",
  "EXEC VERSION 41.10",
  "64K RAM SYSTEM",
  "38911 BYTES FREE",
  "NO HOLOTAPE FOUND",
  "LOAD ROM(1): DEITRIX 303",
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

// ---------------- SHUTDOWN DATA ----------------

const shutdownLines = [
  "",
  "Saving system state...",
  "Flushing memory buffers...",
  "Powering down RobCo Unified OS...",
  "",
  "SYSTEM HALTED"
];

// ---------------- UTILS ----------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeLine(text, baseSpeed = 25) {
  for (const char of text) {
    term.write(char);
    await sleep(baseSpeed + Math.random() * 20);
  }
  term.write("\r\n");
}

// ---------------- ROBCO BOOT SEQUENCE ----------------

async function playRobcoBoot() {
  for (const line of messagesBeforeRobco) {
    if (line === "") {
      term.writeln("");
      await sleep(50);
    } else {
      await typeLine(line, 5);
    }
  }

  await sleep(300);

  // 🔥 ASCII SPEED FIX: much faster typing
  for (const line of robcoAsciiArt) {
    await typeLine(line, 0); // almost instant per character
  }

  await sleep(300);

  for (const line of messagesAfterRobco) {
    await typeLine(line, 18);
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

  (async () => {
    for (const line of bootLines) {
      await typeLine(line, 10);
    }
    connectBackend();
  })();
}

// ---------------- BACKEND CONNECTION ----------------

function connectBackend() {
  term.writeln("Connecting to secure shell...");
  socket = new WebSocket("ws://192.168.0.145:9080");

  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    stage = "connected";
    term.writeln("Connected. Welcome to PipOS 3000.");
  };

  socket.onmessage = e => {
    // --- CONTROL MESSAGE HANDLING ---
    try {
      const msg = JSON.parse(e.data);

      if (msg.type === "SYSTEM_SHUTDOWN") {
        playShutdownSequence();
        return;
      }
    } catch {
      // not JSON → normal terminal output
    }

    term.write(new TextDecoder().decode(e.data));
  };

  socket.onclose = () => {
    if (stage === "connected") {
      playShutdownSequence();
    }
  };
}

// ---------------- SHUTDOWN SEQUENCE ----------------

async function playShutdownSequence() {
  if (stage === "shutdown") return;

  term.clear();
  stage = "shutdown";

  for (const line of shutdownLines) {
    await typeLine(line, 20);
  }

  // hide cursor (feels powered off)
  term.write("\x1b[?25l");

  document
    .getElementById("pipboy-screen")
    .classList.add("power-off");
}

// ---------------- INPUT HANDLING ----------------

term.onData(data => {
  // no input once powered off
  if (stage === "shutdown") return;

  const code = data.charCodeAt(0);

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
      inputBuffer = "";
      return;
    }
  }

  // if (code === 127) {
  //   if (inputBuffer.length > 0) {
  //     inputBuffer = inputBuffer.slice(0, -1);
  //     term.write("\b \b");
  //   }
  //   return;
  // }
if (code === 127) {
  if (stage === "connected") {
    socket.send(data); // let bash handle it
    return;
  }

  // firmware mode only
  if (inputBuffer.length > 0) {
    inputBuffer = inputBuffer.slice(0, -1);
    term.write("\b \b");
  }
  return;
}

  if (stage === "wait_start") {
    inputBuffer += data;
    term.write(data);
    return;
  }

  // if (stage === "connected") {
  //   inputBuffer += data;
  //   socket.send(data);
  // }
  if (stage === "connected") {
  socket.send(data);
}

});

// ---------------- START ----------------

playRobcoBoot();
