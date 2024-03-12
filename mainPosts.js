const pupHelper = require('./helpers/puppeteerhelper');
const { fs_handler } = require('./helpers/extra');

const siteLink = "https://salsa-project.github.io/Class-Concept/";
let delay = 10; // in seconds
let stateFilePath = './data/statesConfig.json';

async function mainPosts(page) {
    //set states
    let statesConfig = {};
    let isCitiesLinkScrapred = false;
    // Check if the state file exists and load its content
    let isStateFileExist = await fs_handler(stateFilePath, 'check');
    if (isStateFileExist) {
        statesConfig = await fs_handler(stateFilePath);
        if (!statesConfig) statesConfig = {};
        isCitiesLinkScrapred = statesConfig?.isCitiesLinkScrapred || false;
    }
    // Create data directory if it doesn't exist
    let directory = `./data`;
    let checkDir = await fs_handler(directory, 'check')
    if (!checkDir) {
        await fs_handler(directory, 'makeDir');
    }



    // #1: getting H1
    try {
        if (!isCitiesLinkScrapred) {
            await page.goto(siteLink, { waitUntil: 'domcontentloaded', timeout: 0 });
            await page.waitForSelector('h1');

           

            // Get cities links
            let title = await pupHelper.getTxt('h1', page);
            console.log(title)

            // Update states configuration
            statesConfig.isCitiesLinkScrapred = true;
            await fs_handler(stateFilePath, 'write', statesConfig);
        }

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
    } catch (error) {
        console.error('Error while getting cities links:', error);
    } finally {
        await page.close();
    }

}

module.exports = mainPosts;
