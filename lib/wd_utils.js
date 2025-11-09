/*
Selenium WebDriver utils.
Defines set of utility functions for shortening and simplifying code for frequent use cases.

Example of usage can be found in /tests/test_wd.ts
*/

const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const { Options } = require('selenium-webdriver/chrome');
const { PageLoadStrategy } = require('selenium-webdriver/lib/capabilities.js');
const fs = require('fs');

/**
 * WebDriver instance connected to the current browser session.
 */
exports.driver = null;

/**
 * Default waiting times
 */
exports.default_timings = {
  pause: 3, // seconds of waiting before making screenshots
  wait: 10, // seconds of waiting for elements to get visible
  timeout: 5 // global settings for timeouts in seconds
}

/**
 * WebDriver options arguments to use for creation of new driver.
 */
exports.default_driver_arguments = [
    '--headless',
    '--disable-gpu',
    '--window-size=1920,1080'
]

/**
 * Number of series of screenshots. Can be changed externally by the test code to keep all screenshots of one series prefixed by the same number.
 * By default this counter starts with 1 and increments with each call of Build() function.
 */
exports.screenSeries = 0;

/**
 * Number of screenshot in the current series. Can be changed externally by the test code.
 * By default this counter resets to 1 with each call of Build() function and increments with each screenshot made.
 */
exports.screenCounter = 0;

/**
 * Number of decimal places for formatting of series number
 */
exports.screenSeriesDigits = 3;

/**
 * Number of decimal places for formatting of screenshot number
 */
exports.screenCounterDigits = 2;


/**
 * Write a log message to the console. The message is prefixed with current date and time in ISO format.
 * @param {string} str 
 */
exports.log = function (str) {
  console.log('%s - %s', (new Date()).toISOString(), str)
}

/**
 * Open new browsing session, create new instance of WedDriver object and assign it to 'driver' proparty.
 * @param {string[]} arguments - arguments for the driver Options; if not specified, default_driver_arguments are used
 */
exports.Build = async function (arguments = exports.default_driver_arguments) {
  let options = new Options();
  arguments.forEach((val) => {
    options.addArguments(val);
  });
  options.setPageLoadStrategy(PageLoadStrategy.EAGER);

  exports.driver = await new Builder().forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build()

  await exports.driver.manage().setTimeouts({ implicit: 1000*exports.default_timings.timeout });

  exports.screenCounter = 0;
  exports.screenSeries++;
}

/**
 * Close current browser session
 */
exports.Quit = async function () {
  await exports.driver.quit()
  exports.driver = null;
}

/**
 * Make a screenshot and save it as a file in PNG format.
 * @param {string} filename - file name to save; this is a basename, it is prefixed with number of the series and number of the screenshot (sequence number in the session) and suffixed by the extension '.png'
 */
exports.saveScreenshot = async function (filename) {
  await exports.driver.takeScreenshot().then(
    function (image, err) {
      exports.screenCounter++;
      fs.writeFile(`${exports.screenSeries.toString().padStart(exports.screenSeriesDigits, '0')}-${exports.screenCounter.toString().padStart(exports.screenCounterDigits, '0')}-${filename}.png`, image, 'base64', function (err) {
        if (err != null) exports.log('error: ' + err);
      });
      exports.log(`Captured ${filename}`)
    }
  )
}

/**
 * Wait several seconds, then make a screenshot and save it as a file in PNG format.
 * @param {string} filename - file name to save; this is a basename, it is prefixed with number of the screenshot (sequence number in the session) and suffixed by the extension '.png'
 * @param {Number} sec - seconds to wait before taking the screenshot; if not specified, default_timings.pause is used
 */
exports.screenshot = async function (filename, sec = exports.default_timings.pause) {
  exports.log(`waiting ${sec} sec for loading...`)
  await exports.driver.sleep(sec * 1000)
  await exports.saveScreenshot(filename)
}

/**
 * Wait several seconds.
 * @param {Number} sec - seconds to wait; if not specified, default_timings.pause is used
 */
exports.wait = async function (sec = exports.default_timings.pause) {
  exports.log(`waiting ${sec} sec for loading...`)
  await exports.driver.sleep(sec * 1000)
}

/**
 * Wait until title gets the expected value
 * @param {string} title page title that is expected
 * @param {Number} sec number of seconds to wait until the title gets the expected value
 */
exports.checkTitle = async function (title, sec = exports.default_timings.wait) {
  await exports.driver.wait(until.titleIs(title), sec * 1000);
}

/**
 * Click on the element specified by *XPath* parameter, if the element is not visible yet, wait up to *sec* seconds to let it get visible.
 * @param {string} name - logical name of the element - will be written in the log 
 * @param {string} xpath - XPath string specifying how to find the element on the page
 * @param {Number} sec - number of seconds to wait until the element get visible
 */
exports.click = async function (name, xpath, sec = exports.default_timings.wait) {
  let element = await exports.driver.findElement(By.xpath(xpath))
  exports.log(`Waiting ${sec} sec for ${name} to get visible`)
  await exports.driver.wait(until.elementIsVisible(element), sec * 1000)
  exports.log(`${name} - found; clicking`)
  await element.click()
}

/**
 * Type the text given in *text* parameter into the element specified by *XPath* parameter, if the element is not visible yet, wait up to *sec* seconds to let it get visible.
 * @param {string} name logical name of the element, will be written in the log
 * @param {string} text text to type in the field
 * @param {string} xpath Xpath string specifying how to find the element on the page
 * @param {Number} sec number of seconds to wait until the element get visible
 */
exports.type = async function (name, text, xpath, sec = exports.default_timings.wait) {
  let element = await exports.driver.findElement(By.xpath(xpath))
  exports.log(`Waiting ${sec} sec for ${name} to get visible`)
  await exports.driver.wait(until.elementIsVisible(element), sec * 1000)
  exports.log(`${name} - found; typing-in "${text}"`)
  await element.sendKeys(text)
}

/**
 * Searches an element on the page by *xpath* provided.
 * @param {string} xpath Xpath string specifying how to find the element on the page
 * @returns true if the element is found on the page
 */
exports.isFound = async function (xpath) {
  let elements = await exports.driver.findElements(By.xpath(xpath));
  let found = elements.length > 0;
  return found;
}

/**
 * Find an input field by *xpath* and clears its content doing "select all" and "delete".
 * @param {string} xpath Xpath string specifying how to find the element on the page
 */
exports.clearField = async function (xpath) {
  const field = await exports.driver.findElement(By.xpath(xpath));
  await exports.driver.executeScript("arguments[0].select();", field)
  await exports.driver.actions().keyDown(Key.DELETE);
}

/**
 * Scroll to the element to make it visible on the screen.
 * @param {string} xpath Xpath string specifying how to find the element on the page
 */
exports.scrollTo = async function (xpath) {
  const element = await exports.driver.findElement(By.xpath(xpath));
  await exports.driver.executeScript("arguments[0].scrollIntoView();", element);
}

/**
 * Get attribute of the element specified by it XPath
 * @param {string} xpath Xpath string specifying how to find the element on the page
 * @param {string} attribute name of the attribute to get
 * @returns value of the specified attribute
 */
exports.getAttribute = async function (xpath, attribute) {
  return await exports.driver.findElement(By.xpath(xpath)).getAttribute(attribute);
}

/**
 * Get text of the element specified by it XPath
 * @param {string} xpath Xpath string specifying how to find the element on the page
 * @returns text of the element
 */
exports.getText = async function (xpath) {
  const element = await exports.driver.findElement(By.xpath(xpath));
  return await element.getText();
}

/**
 * Find an element by xpath provided and execute the script provided having the element as a parameter arguments[0]
 * @param {string} xpath Xpath string specifying how to find the element on the page
 * @param {string} script javascript to execute arguments[0] in the script points to the element. Example: "arguments[0].click();"
 */
exports.execJS = async function (xpath, script) {
  const element = await exports.driver.findElement(By.xpath(xpath));
  await exports.driver.executeScript(script, element);
}
