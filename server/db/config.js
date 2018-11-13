// creating two separate databases, for dev and test
let env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  let configuration = require('./config.json');
  let envConfiguration = configuration[env]; // grab config for chosen environment -> development / test
  Object.keys(envConfiguration).forEach(key => {
    process.env[key] = envConfiguration[key];
  });
}
