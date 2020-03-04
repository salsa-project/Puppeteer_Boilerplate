const pupHelper = require('./puppeteerhelper');
const fs = require('fs');
const siteLink = "https://www.cushmanwakefield.com/en/united-states/people/search#f:City=[New%20York]";
// let contacts = [];

(async () => {
  if (fs.existsSync('contact.csv')) fs.unlinkSync('contact.csv');
  const browser = await pupHelper.launchBrowser(true);
  const page = await pupHelper.launchPage(browser);
  const response = await page.goto(siteLink, {timeout: 0, waitUntil: 'load'});
  
  let nextPage = true;
  let pageNumber = 1;
  do {
    console.log(`Fetching contacts from page ${pageNumber}`);
    await page.waitForSelector('.coveo-result-list-container > .coveo-card-layout');
    const contactCardsNodes = await page.$$('.coveo-result-list-container > .coveo-card-layout:not(.coveo-card-layout-padding)');
    for (let i = 0; i < contactCardsNodes.length; i++) {
      const name = await contactCardsNodes[i].$eval('.card > .card-body > h6', elm => elm.innerText.trim());
      const title = await contactCardsNodes[i].$eval('p.card-text > span', elm => elm.innerText.trim());
      const email = await contactCardsNodes[i].$eval('p.font-weight-bold > a[href^="mailto"]', elm => elm.innerText.trim());
      const contact = {name, title, email};
      savetocsv('contact.csv', contact);
    }
    const nextPageNode = await page.$('.coveo-pager-list a[title="Next"]');
    if (nextPageNode) {
      await page.click('.coveo-pager-list a[title="Next"]');
      await page.waitFor(10000);
      pageNumber++;
    } else {
      nextPage = false;
    }

  } while (nextPage);

  await page.close();
  await browser.close();
})()

async function savetocsv(fileName, data) {
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, '"Name","Title","Email"\n');
  };
  fs.appendFileSync(fileName, `"${data.name}","${data.title}","${data.email}"\n`);
}