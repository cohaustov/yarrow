// Trivial run_tests.js version
// Does not actually run tests, used to check that parameters are passed correctly

var args = require("./args.js");

const conf = new Map([
  ["session", ""],
  ["script", ""]
]);

console.log(args.toString());

args.fillConfig(conf);

conf.forEach((value, key) => {
  console.log(`${key} = ${value}`);
});
