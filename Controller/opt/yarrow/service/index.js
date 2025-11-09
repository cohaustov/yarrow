const { createServer } = require('node:http');
const { URL }  = require('node:url');

const port = process.env.YI_PORT || 8400;
const host = process.env.YI_HOST || "localhost";

const baseURL = `http://${host}:${port}/`;

const PATH_NEXTID = '/nextid';
const PARAM_SESSION = 'session';
const PARAM_VMID = 'vmid';

// Map of int indexes, every read request increments value of the index; indexind starts from 0; indexes.get(sesion) - gives current index
const indexes = new Map();

// Map of Maps of int: assignment.get(session).get(vmid) - gives index that is currently assigned to the VM (vmid)
// postponing util next phase
// const assignments = new Map();

createServer((req, res) => {
    const reqURL = new URL(req.url, baseURL);
    if (reqURL.pathname == PATH_NEXTID) {
        const session = reqURL.searchParams.get(PARAM_SESSION) ?? "default"; // if session is not provided, using "default"
        const vmid = reqURL.searchParams.get(PARAM_VMID) | 0; // if vmid is not provided, using 0 (normally, VM numeration starts from 1)

        const id = indexes.has(session) ? indexes.get(session) + 1 : 0;
        indexes.set(session, id);

        res.writeHead(200, { "Content-Type": "text/json" });
        res.write(`{"id": ${id}, "session": "${session}", "vmid": "${vmid}"}\n`);
        res.end();
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("yarrow-index");
        res.end();
    }

}).listen(port, () => {
    console.log(`Yarrow-index is running on port ${port}`);
});
