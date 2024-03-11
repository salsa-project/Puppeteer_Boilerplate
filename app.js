const fs = require('fs');

const pupHelper = require('./helpers/puppeteerhelper');
const mainPosts = require('./mainPosts');





(async () => {
  let browser;
  try {
    // start browser
    browser = await pupHelper.launchBrowser(debug=false, headless=false);
    const page = await pupHelper.launchPage(browser, blockResources=false);
    
    await mainPosts(page)


  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await pupHelper.closeBrowser(browser);
    }
  }
})();