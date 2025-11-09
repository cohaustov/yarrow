/*
This is an example of testing script that uses selenium-webdriver library directly, without utility module "wd_utils".

When using direct calls to selenium webdriver, you need to do "npm install selenium-webdriver" in current folder.
*/

const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const { Options } = require('selenium-webdriver/chrome');
const args = require("../../yarrow/lib/args");
const index = require("../../yarrow/lib/index_client");


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

    let options = new Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    let driver = await new Builder().forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build()

    let scr_cnt = 0;
    function saveScreenshot(filename) {
      driver.takeScreenshot().then(
        function (image, err) {
          scr_cnt++;
          require('fs').writeFile(`${i.toString().padStart(3,'0')}-${scr_cnt.toString().padStart(2,'0')}-${filename}.png`, image, 'base64', function (err) {
            if (err != null) console.log('error: ' + err);
          });
          log(`Captured ${filename}`)
        }
      )
    }

    function log(str) {
      console.log('%s - %s', (new Date()).toISOString(), str)
    }

    async function saveScreenWait(filename, sec) {
      log(`waiting ${sec} sec for loading...`)
      await driver.sleep(sec * 1000)
      saveScreenshot(filename)
    }

    async function wait_and_click(name, xpath, sec) {
      log(`Waiting ${sec} sec for ${name} to get visible`)
      let element = driver.findElement(By.xpath(xpath))
      await driver.wait(until.elementIsVisible(element), sec * 1000)
      log(`${name} - found; clicking`)
      await element.click()
    }

    async function wait_and_type(name, text, xpath, sec) {
      log(`Waiting ${sec} sec for ${name} to get visible`)
      let element = driver.findElement(By.xpath(xpath))
      await driver.wait(until.elementIsVisible(element), sec * 1000)
      log(`${name} - found; typing-in "${text}"`)
      await element.sendKeys(text)
    }

    try {
      log(`Opening URL: ${base_url}`)
      await driver.get(base_url)
      await driver.wait(until.titleIs('Selenium'), 10000)
      log('Selenium home page - found')
      await saveScreenWait('home-screen', 3);

      await wait_and_click('Menu Documentation', '//*[@id="main_navbar"]/ul/li[3]/a', 20)
      await saveScreenWait('documentation', 3);

      await wait_and_click('Menu WebDriver', '//*[@id="m-documentationwebdriver"]', 20)
      await saveScreenWait('webdriver', 3);

      await wait_and_click('Supported Browsers', '//*[@id="m-documentationwebdriverbrowsers"]/span', 20)
      await saveScreenWait('browsers', 3);

      await wait_and_click('Chrome', '//*[@id="m-documentationwebdriverbrowserschrome"]/span', 20)
      await saveScreenWait('browsers-chrome', 3);

    } catch (err) {
      log(`Error: ${err.message}`)
    } finally {
      await driver.quit()
      log('Finished')
    }
  }
})()
