const {argv, exit} = require('node:process');

// 'assign' operation in the arguments of format "arg=value"
const arg_equals = '=';

// Read arguments passed to the application on start and update config. Expects arguments in form of assignments "arg=value".
// Exit with error level 1 if argument is in incorrect format
// Exit with error level 1 if a parameter does not match any existing key in config and acceptUnknown is false
// config - a map with all the parameters supported by the application
// acceptUnknown - true (default) means accepting any parameter, false - accept only the parameters presented in config map
exports.fillConfig = function (config, acceptUnknown=true) {
  argv.forEach((val, index) => {
    if (index > 1)
      if (val.includes(arg_equals)) {
        const param = val.split(arg_equals);
        if (acceptUnknown || config.has(param[0])) {
          config.set(param[0], param[1]);
        } else {
          console.log(`'${param[0]}' - unknown parameter; here is the list of supported parameters:`);
          for (const k of config.keys())
            console.log(k);
          exit(1);
        }
      } else {
        console.log(`'${val}' - invalid argument format; must be 'arg=value'`);
        exit(1);
      }
  });
}

// Constructs a string with all arguments passed to the application
// start - number of argument to start with, default is 2 which means skip path to node (arg 0) and name of executable js file (arg 1)
exports.toString = function (start=2) {
  var result = "";
  var space = "";
  argv.forEach((val, index) => {
    if (index >= start) {
      result = result.concat(space, val);
      space = " ";
    }
  });
  return result;
}
