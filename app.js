const fs = require('fs');

const pupHelper = require('./helpers/puppeteerhelper');





const siteLink = "https://salsa-project.github.io/Class-Concept/";

(async () => {
  let browser;
  try {
    // start browser
    browser = await pupHelper.launchBrowser(debug=false, headless=false);
    const page = await pupHelper.launchPage(browser);
    // handle page scrap/automation
    await runLogicFn(page, siteLink);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await pupHelper.closeBrowser(browser);
    }
  }
})();




/*=======================================

          HANDLE PAGE LOGIC
         (Scrap || Automation)

*=======================================*/
const runLogicFn = async (page, link) => {
  try {
    const response = await page.goto(link, { timeout: 0, waitUntil: 'load' });
    
    //  Add logic to interact with the page or extract information
    await page.waitForSelector('h1');

    let pageTitle = await pupHelper.getTxt('h1', page);
    console.log(pageTitle)


  } catch (error) {
    console.error('Logic Function Error:', error);
  } finally {
    // Close the page within the runLogicFn function
    await page.close();
  }
};
