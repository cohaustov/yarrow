/*
This is an example of testing script that uses wd_utils module.

When using wd_utils module, you need to do "npm install selenium-webdriver" in lib folder.
*/

const args = require("../../yarrow/lib/args");
const index = require("../../yarrow/lib/index_client");
const wd = require("../../yarrow/lib/wd_utils");

const base_url = 'https://www.selenium.dev/';

const ARG_ITERATIONS = "iter"; // number of iterations to do
const ARG_VMID = "vmid"; // id of current VM (1-based)
const ARG_RUNNERS = "runners"; // number of VMs working in parallel
const ARG_HOST = "host"; // IP address of Controller host. Not used here but might be needed in some cases.
const ARG_SESSION = "session"; // unique session name consisting of user name started the session and date-time suffix
const config = new Map([
  [ARG_ITERATIONS, 1], 
  [ARG_VMID, 1],
  [ARG_RUNNERS, 1]
]);

args.fillConfig(config);
console.log('Executing with parameters:');
config.forEach((val, key) => {
  console.log(`${key}=${val}`);
});


console.log("Starting test");

(async function run_test() {
  for (let i=0; i<config.get(ARG_ITERATIONS); i++) {

    let global_id = 0;
    try {
      global_id = await index.getNextId(config.get(ARG_SESSION));
    } catch (err) {
      console.log(err.message);
    }
    console.log(`global_id = ${global_id}`);

    await wd.Build();

    try {
      wd.log(`Opening URL: ${base_url}`)

      await wd.driver.get(base_url);
      await wd.checkTitle('Selenium');
      wd.log('Selenium home page - found');
      await wd.screenshot('home-screen');

      await wd.click('Menu Documentation', '//*[@id="main_navbar"]/ul/li[3]/a');
      await wd.screenshot('documentation');

      await wd.click('Menu WebDriver', '//*[@id="m-documentationwebdriver"]');
      await wd.screenshot('webdriver');

      await wd.click('Supported Browsers', '//*[@id="m-documentationwebdriverbrowsers"]/span');
      await wd.screenshot('browsers');

      await wd.click('Chrome', '//*[@id="m-documentationwebdriverbrowserschrome"]/span');
      await wd.screenshot('browsers-chrome');

    } catch (err) {
      wd.log(`Error: ${err.message}`);
    } finally {
      await wd.Quit();
      wd.log('Finished');
    }
  }
})()
