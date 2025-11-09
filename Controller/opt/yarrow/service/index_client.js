const http = require('node:http');
const { URL } = require('node:url');
const cfg = require('./index_cfg');

/**
 * Makes HTTP GET request to the specified address and expects response in JSON format.
 * Checks the result type and parses JSON text into an object. Throws error if something is wrong.
 * @param {string} href - URI of the resource to get.
 * @returns An object that is parsed from the received JSON.
 */
async function getJSON(href) {
  let promise = new Promise(function (resolve, reject) {
    http.get(href, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed. Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(`Invalid content-type. Expected application/json but received ${contentType}`);
      }
      if (error) {
        res.resume(); // Consume response data to free up memory
        reject(error.message);
      } else {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (err) {
            reject(err);
          }
        });
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
  const result = await promise.catch((err) => {
    throw new Error(err);
  });
  return result;
}

/**
 * Requests next Id from the central index service running on the Controller.
 * @param {string} session - Unique identifier of the session; optional, if ommitted, default session is used.
 * @param {number} vmid - Id of the virtual machine making the request; optional, reserved for future use.
 * @returns {number} Next unique Id in the sequence.
 */
exports.getNextId = async function (session = null, vmid = null) {
  const url = new URL(cfg.PATH_NEXTID, cfg.getBaseURL());
  if (session != null) {
    url.searchParams.append(cfg.PARAM_SESSION, session);
  }
  if (vmid != null) {
    url.searchParams.append(cfg.PARAM_VMID, vmid);
  }
  const json = await getJSON(url.href);
  return json["id"];
}

async function Test() {
  try {
    const id = await exports.getNextId(null, null);
    console.log(`Next id is ${id}`);
  } catch (err) {
    console.log(err.message);
  }
}

Test();
