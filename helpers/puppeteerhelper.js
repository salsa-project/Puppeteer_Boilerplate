const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');

const puppeteerExtra = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');

puppeteerExtra.use(Stealth());

module.exports.launchBrowser = (debug = false, headless=false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteerExtra.launch({
        headless: headless,
         //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',   // Use Windows chrome Browser
         executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',   // Use Windows edge Browser
         //slowMo: 10,              // Slow down the browser
         timeout: 0,              // Disable timeout
        // defaultViewport: null,
        // userDataDir: './temp',
        ignoreHTTPSErrors: true,
        devtools: debug,
        args: [
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certifcate-errors',
          '--ignore-certifcate-errors-spki-list',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-accelerated-2d-canvas',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1366x768',
          // '--proxy-server=143.255.52.90:8080'
          // '--user-data-dir',                            // use local data directory called tmp
          // '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
        ],
      });
      resolve(browser);
    } catch (error) {
      console.log('Browser Launch Error: ', error);
      reject(error);
    }
  });
}

/**
 * Close the Puppeteer browser instance
 * @param {object} browser - Puppeteer Browser Instance
 * @return {Promise<boolean>} Resolves to true when the browser is closed
 */
module.exports.closeBrowser = (browser) => new Promise(async (resolve, reject) => {
  try {
    if (browser) await browser.close();
    resolve(true);
  } catch (error) {
    console.log(`closeBrowser Error: ${error}`);
    reject(error);
  }
});


module.exports.launchPage = (browser, blockResources = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create New Page
      const page = await browser.newPage();

      // Set page View Port
      // await page.setViewport({ width: 1366, height: 768 });

      // Set user agent for page.
      const userAgent = new UserAgent().toString();
      await page.setUserAgent(userAgent);

      // Pass the Webdriver Test.
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
      });

      if (blockResources === true) {
        const blockedResources = [
          'image',
          'stylesheet',
          'media',
          'font',
          'texttrack',
          'object',
          'beacon',
          'csp_report',
          'imageset'
        ];

        const skippedResources = [
          'quantserve',
          'adzerk',
          'doubleclick',
          'adition',
          'exelator',
          'sharethrough',
          'cdn.api.twitter',
          'google-analytics',
          'googletagmanager',
          'google',
          'fontawesome',
          'facebook',
          'analytics',
          'optimizely',
          'clicktale',
          'mixpanel',
          'zedo',
          'clicksor',
          'tiqcdn',
        ];

        // Set Request Interception to avoid receiving images, fonts and stylesheets for fast speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const requestUrl = (req.url()).split('?')[0].split('#')[0];
          if (
            blockedResources.includes(req.resourceType()) ||
            skippedResources.some(resource => requestUrl.includes(resource))
          ) {
            req.abort();
          } else {
            req.continue();
          }
        });
      }

      // Set Extra Header for request
      await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.8',
      });

      // Set Session Cookie
      // await page.setCookie({
      //   'name': 'li_at',
      //   'value': process.env.LINKEDIN_SESSION_COOKIE_VALUE,
      //   'domain': '.www.linkedin.com'
      // })
       
      // Disable Javascript to overcome f/e anti-bot
      // await page.setJavaScriptEnabled(false);
      
      // Authenticate Proxy Server
      // await page.authenticate({username: proxyUser, password: proxyPassword});

      resolve(page);
    } catch (error) {
      console.log('Launch Page Error: ', error);
      reject(error);
    }
  });
}

/**
 * Fetch html of the given selector from a page using puppeteer 
 * @param  {string} selector CSS selector from which html is to be fetched
 * @param  {object} page Page Instance
 * @return {string} Found: HTML from node, Not Found: Empty string
 */
module.exports.getHTML = (selector, page) => new Promise(async (resolve, reject) => {
  try {
    let html = '';
    const isNode = await page.$(selector);
    if (isNode) {
      html = await page.$eval(
          selector, (elm) => elm.innerHTML.trim()
      )
    };
    
    resolve(html);
  } catch (error) {
    console.log(`getHTML Error: ${error}`);
    reject(error);
  }
});

/**
 * Fetch text of the given selector from a page using puppeteer 
 * @param  {string} selector CSS selector from which text is to be fetched
 * @param  {object} page Page Instance
 * @return {string} Found: Text from node, Not Found: Empty string
 */
module.exports.getTxt = (selector, page) => new Promise(async (resolve, reject) => {
  try {
    let txt = '';
    const isNode = await page.$(selector);
    if (isNode) {
      txt = await page.$eval(
          selector, (elm) => elm.innerText.trim()
      )
    };

    resolve(txt);
  } catch (error) {
    console.log(`getTxt Error: ${error}`);
    reject(error);
  }
});

/**
 * Fetch text from selector matching multiple nodes from a page using puppeteer 
 * @param  {string} selector CSS selector from which text is to be fetched
 * @param  {object} page Page Instance
 * @return {array} Found: Array including texts from all nodes, Not found: Empty Array
 */
module.exports.getTxtMultiple = (selector, page) => new Promise(async (resolve, reject) => {
  try {
    let txt = [];
    const isNode = await page.$(selector);
    if (isNode) {
      txt = await page.$$eval(
          selector, elms => elms.map(elm => elm.innerText.trim())
      )
    };

    resolve(txt);
  } catch (error) {
    console.log(`getTxtMultiple Error: ${error}`);
    reject(error);
  }
});

/**
 * Fetch value of given attribute from given selector from a page using puppeteer 
 * @param  {string} selector CSS selector from which attribute is to be fetched
 * @param  {string} attribute Attribute name
 * @param  {object} page Page Instance
 * @return {string} Found: Value of attribute, Not Found: Empty string
 */
module.exports.getAttr = (selector, attribute, page) => new Promise(async (resolve, reject) => {
  try {
    let attr = '';
    const isNode = await page.$(selector);
    if (isNode) {
      attr = await page.$eval(
        selector,
        (elm, attribute) => elm.getAttribute(attribute).trim(),
        attribute
      );
    } else {
      console.log(`Node not found`);
    };

    resolve(attr);
  } catch (error) {
    console.log(`getAttr Error: ${error}`);
    reject(error);
  }
});

/**
 * Fetch values of given attribute from given selector matching multiple nodes from a page using puppeteer 
 * @param  {string} selector CSS selector from which attribute is to be fetched
 * @param  {string} attribute Attribute name
 * @param  {object} page Page Instance
 * @return {string} Found: Array including values of attribute from all matching nodes, Not Found: Empty Array
 */
module.exports.getAttrMultiple = (selector, attribute, page) => new Promise(async (resolve, reject) => {
  try {
    let attr = [];
    const isNode = await page.$(selector);
    if (isNode) {
      attr = await page.$$eval(
        selector,
        (elms, attribute) => elms.map(elm => elm.getAttribute(attribute).trim()),
        attribute
      );
    };

    resolve(attr)
  } catch (error) {
    console.log(`getAttrMultiple Error: ${error}`);
    reject(error);
  }
});

/**
* Auto-scroll function for scrolling a page to load additional content
* @param {object} page - Puppeteer Page Instance
* @param {number} distance - Scroll distance in pixels
* @param {number} interval - Interval in milliseconds between scroll steps
* @return {Promise<void>} Resolves when scrolling is complete
*/
module.exports.autoScroll = async (page, distance = 250, interval = 500) => {
 await page.evaluate(async (distance, interval) => {
   await new Promise((resolve) => {
     let page = 1;
     let totalHeight = 0;

     const timer = setInterval(() => {
       console.log(`${page} - Scrolling...`);
       page++;

       const scrollHeight = document.body.scrollHeight;
       window.scrollBy(0, distance);
       totalHeight += distance;

       if (totalHeight >= scrollHeight) {
         clearInterval(timer);
         resolve();
       }
     }, interval);
   });
 }, distance, interval);
};
