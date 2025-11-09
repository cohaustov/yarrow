const { createServer } = require('node:http');
const { exit } = require('node:process');
const { URL } = require('node:url');
const cfg = require('./index_cfg');

// Map of int indexes, every read request increments value of the index; indexind starts from 0; indexes.get(sesion) - gives current index
const indexes = new Map();

// Map of Maps of int: assignment.get(session).get(vmid) - gives index that is currently assigned to the VM (vmid)
// postponing util next phase
// const assignments = new Map();

createServer((req, res) => {
  const reqURL = new URL(req.url, cfg.getBaseURL());
  if (reqURL.pathname == cfg.PATH_NEXTID) {
    const session = reqURL.searchParams.get(cfg.PARAM_SESSION) ?? "default"; // if session is not provided, using "default"
    const vmid = reqURL.searchParams.get(cfg.PARAM_VMID) | 0; // if vmid is not provided, using 0 (normally, VM numeration starts from 1)

    const id = indexes.has(session) ? indexes.get(session) + 1 : 0;
    indexes.set(session, id);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(`{"id": ${id}, "session": "${session}", "vmid": "${vmid}"}\n`);
    res.end();
  } else if (reqURL.pathname == cfg.PATH_TERMINATE) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("Terminated");
    res.end();
    console.log('Exiting by "terminate" command');
    exit(0);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("yarrow-index");
    res.end();
  }

}).listen(cfg.port, () => {
  console.log(`Yarrow-index is running on port ${cfg.port}`);
});
