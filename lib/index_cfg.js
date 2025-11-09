exports.port = process.env.Y_PORT || 8400;
exports.host = process.env.Y_HOST || "localhost";

exports.getBaseURL = function () {
  return `http://${exports.host}:${exports.port}/`;
}

exports.PATH_NEXTID = '/nextid';
exports.PATH_TERMINATE = '/terminate_n0w';
exports.PARAM_SESSION = 'session';
exports.PARAM_VMID = 'vmid';

