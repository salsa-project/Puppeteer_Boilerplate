/*===============================
        MODULES & Configs
================================*/
import fs from 'fs';



/*================================
            FS Handler
================================*/
async function writeFn(filePath, jsonString) {
    try {
        await fs.promises.writeFile(filePath, jsonString, 'utf8');
        //console.log('Data appended to JSON file successfully.');
    } catch (writeErr) {
        console.error('Error writing to JSON file:', writeErr);
    }
}
async function readFn(filePath, fileStats) {
    try {
        if (0 === fileStats.size) return null;
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (readErr) {
        console.error('Error reading JSON file:', readErr);
        return null;
    }
}
// Function to save partial result to JSON file
async function partialApend(filePath, { data, char = "", extra = null }) {
    try {
        const jsonString = `${(!extra) ? "" : '"' + extra + '"' + ':'}` + JSON.stringify(data, null, 4) + char + '\n';
        await fs.promises.appendFile(filePath, jsonString, 'utf8');
        //console.log(`Partial data appended to JSON file successfully.`);
    } catch (appendErr) {
        console.error('Error appending to JSON file:', appendErr);
    }
}

async function partialRead(filePath, fileStats, dataResult = { sep: null, closer: [] }) {
    try {
        if (0 === fileStats.size) return null;
        const data = await fs.promises.readFile(filePath, 'utf8');
        // get rid of the last 'sep' ex: (,)
        const jsonStringWithoutLastChar = (dataResult.sep) ? data.replace(/,(?=\s*?[\}\]]*\s*$)/g, '') : data;
        let cls = (dataResult.closer.length === 0) ? ["", ""] : [...dataResult.closer];
        const formattedData = cls[0] + jsonStringWithoutLastChar + cls[1];
        return JSON.parse(formattedData);
    } catch (err) {
        console.error('Error reading or parsing JSON file:', err);
        return null;
    }
}
// handle scenarios : write, update, read, check, apend, partialRead
const fs_handler = async function (filePath, action = "read", dataResult = null) {
    let isPathExist =  fs.existsSync(filePath);
    const fileStats = (isPathExist && action !== "check") && fs.statSync(filePath);
    switch (action) {
        case 'read':
            if (!isPathExist) return console.log('Path(file/folder) Does Not Exist!');
            try {
                let data = await readFn(filePath, fileStats);
                return data;
            } catch (err) {
                console.error('Error reading file:', err);
            }
            break;
        case 'partialRead':
            if (!isPathExist) return console.log('Path(file/folder) Does Not Exist!');
            try {
                let res = await partialRead(filePath, fileStats, dataResult);
                return res;
            } catch (err) {
                console.error('Error reading partial file:', err);
            }
            break;
        case 'check':
            return Promise.resolve(isPathExist);
            break;
        case 'getStats':
            let stats = (isPathExist) ? fs.statSync(filePath) : null;
            return Promise.resolve(stats);
            break;
        case 'makeDir':
            fs.mkdirSync(filePath, { recursive: true });
            break;
        case 'update':
            try {
                let jsonData = dataResult;
                if (isPathExist) {
                    let data = await readFn(filePath);
                    jsonData = (fileStats.size > 0) ? JSON.parse(data) : [];
                    if (!Array.isArray(dataResult) || dataResult.some(item => typeof item !== 'object')) {
                        console.error('Error: DataResult is not a valid array of objects');
                        return;
                    }
                    jsonData.push(...dataResult);
                }
                const jsonString = JSON.stringify(jsonData, null, 4);
                await writeFn(filePath, jsonString);
            } catch (err) {
                console.error('Error updating file:', err);
            }
            break;
        case 'write':
            try {
                let jsonData = dataResult;
                if (isPathExist) {
                    if (Array.isArray(dataResult)) {
                        jsonData = [];
                        jsonData.push(...dataResult);
                    }
                }
                const jsonString = JSON.stringify(jsonData, null, 4);
                await writeFn(filePath, jsonString);
            } catch (err) {
                console.error('Error writing file:', err);
            }
            break;
        case 'apend':
            try {
                await partialApend(filePath, dataResult);
            } catch (err) {
                console.error('Error appending to file:', err);
            }
            break;
        case 'apendCSV':
            try{
                await fs.promises.appendFile(filePath, dataResult, 'utf8');
                //console.log('Data appended to CSV file successfully.');
            }catch(err){
                console.error('apendCSV error: ', err)
            }
            break;
        case 'savePic':
            let retryMax = 3;
            let retryDelay = 1000;
            for (let i = 0; i < dataResult.length; i++) {
                let isPicSaved = false;
                let retryPicsCount = 0;
                while (!isPicSaved && retryPicsCount < retryMax) {
                    try {
                        const imageUrl = dataResult[i];
                        const imageResponse = await fetch(imageUrl);
                        const arrayBuffer = await imageResponse.arrayBuffer();
                        const imageBuffer = Buffer.from(arrayBuffer);
                        // modify file name
                        const filePathParts = filePath.split('.');
                        const baseName = filePathParts.slice(0, -1).join('.'); // Get base name without extension
                        const extension = filePathParts[filePathParts.length - 1]; // Get extension
                        const updatedFilename = `${baseName}${i}.${extension}`;
                        fs.writeFileSync(updatedFilename, imageBuffer);
                        isPicSaved = true;
                    } catch (err) {
                        console.error('Error saving picture:', err);
                        retryPicsCount++;
                        console.error(`::::::::::::::Error! RETRY (${retryPicsCount}/${retryMax}) > Link::::::::::::::\n `, `${dataResult[i]}`);
                        // retry delay
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    }
                }

            }
            break;
        default:
            console.error('Invalid action:', action);
            break;
    }
}



/*================================
            Dictionary
================================*/
/**
 * Creates a new dictionary object for managing unique links.
 * The dictionary object provides methods to check if a link exists, add a new link,
 * and log the content of the dictionary.
 * @returns {Object} A new dictionary object with methods for managing unique links.
 */
function createLinkDictionary() {
    return {
        dictionary: {},

        /**
         * Checks if a link exists in the dictionary and returns its corresponding ID.
         * @param {string} link - The link to check.
         * @returns {number|null} The ID of the link if it exists, otherwise null.
         */
        getLinkId(link) {
            return this.dictionary[link] || null;
        },

        /**
         * Adds a new link to the dictionary with the specified ID.
         * @param {string} link - The link to add.
         * @param {number} id - The ID of the link.
         * @returns {Object} The dictionary object for method chaining.
         */
        addLink(link, id) {
            this.dictionary[link] = id;
            return this; // Return the object itself for chaining
        },

        /**
         * Logs the content of the dictionary to the console.
         * @returns {Object} The dictionary object for method chaining.
         */
        logDictionary() {
            console.log("Dictionary:", this.dictionary);
            return this; // Return the object itself for chaining
        }
    };
}



/*================================
     log messages with colors
================================*/
function logWithColor(msg, color) {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        yellow: '\x1b[33m',
        white: '\x1b[37m'
    };

    const resetColor = '\x1b[0m';

    if (colors[color]) {
        console.log(colors[color] + msg + resetColor);
    } else {
        console.log(msg); // Log in default color if an invalid color is provided
    }
}
/*================================
     loading bar in terminal
================================*/
function showInfiniteLoadingBar() {
    const totalSteps = 20;
    let currentStep = 0;
    let direction = 1;
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        yellow: '\x1b[33m',
        white: '\x1b[37m'
    };
    let faces = ['(▀̿Ĺ̯▀̿ ̿)', '(✖╭╮✖)', 'ヽ(͡◕ ͜ʖ ͡◕)ﾉ', '(¬_¬)', '(◍•ᴗ•◍)♡【I LOVE U】✧*。', '♥‿♥', 'ᶘ ◕ᴥ◕ᶅ', '(ᵔᴥᵔ)', 'ʕ·͡ᴥ·ʔ', '(✪‿✪)ノ', 'ლ(▀̿̿Ĺ̯̿̿▀̿ლ)', 'ʕ ͡° ʖ̯ ͡°ʔ', 'ʕ ͝°ل͟ ͝°ʔ', '⤜(ⱺ ʖ̯ⱺ)⤏']
    let currentFace = '(✖╭╮✖)'
    currentFace = faces[Math.floor(Math.random() * faces.length)]

    const interval = setInterval(() => {
        const progressBar = ' ' + ' '.repeat(Math.max(currentStep, 0)) + `<>`.repeat(1) + ' '.repeat(Math.max(totalSteps - currentStep - 1, 0)) + ' ';
        const output = `\r  ${colors.magenta}|Main.js|:${colors.white} ${progressBar}\r`;

        process.stdout.write(output);

        if (currentStep === totalSteps) {
            direction = -1;
        } else if (currentStep === 0) {
            direction = 1;
        }

        currentStep += direction;
    }, 30);

    return () => clearInterval(interval); // This will return a function to stop the interval when called
}
/*================================
    loading progress in terminal
================================*/
const progress = {
    totalSteps: 0,
    currentStep: 0,
    direction: 1,
    reached: false,
    interval: null,
    delay: 150,
    name: 'script',
    colors: {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    },

    start: function () {
        this.interval = setInterval(() => {
            const progressBar = '.'.repeat(this.direction);
            const output = `\r  ${this.colors["cyan"]}|${this.name}|:${this.colors['white']} ${this.currentStep}/${this.totalSteps} ${progressBar} \r`;

            process.stdout.write(output);

            if (this.reached) {
                if (this.direction === 1) {
                    this.reached = false;
                }
                this.direction--;
            } else {
                if (this.direction === 8) {
                    this.reached = true;
                }
                this.direction++;
            }
        }, this.delay);
    },

    update: function (total, current, name='script') {
        this.totalSteps = total;
        this.currentStep = current;
        this.name = name;
    },

    stop: function () {
        clearInterval(this.interval);
    }
};

/*================================
      get Function Duration
================================*/
async function getFuncDuration(extFunc) {

    const start = performance.now();

    try {
        let result;
        if (typeof extFunc === 'function') {
            if (extFunc.constructor.name === 'AsyncFunction') {
                result = await extFunc();
            } else {
                result = extFunc();
            }
        } else {
            throw new Error('extFunction is not a function');
        }

        const end = performance.now();
        const duration = end - start;
        console.log(`Script execution time: ${duration} milliseconds`)
        return { duration, result };
    } catch (error) {
        console.error('Error during function execution:', error);
        throw error;
    }
}
// =======================
// Get Min-Max-Mid Durations
// =======================
//find the minimum, maximum, and estimated midpoint of times
function getMinMaxMid(arr) {
    // Ensure the array is not empty
    if (arr.length === 0) {
        return {
            min: null,
            max: null,
            mid: null
        };
    }

    // Find the minimum and maximum
    const min = Math.min(...arr);
    const max = Math.max(...arr);

    // Calculate the midpoint
    const mid = Math.round((max + min) / 2);

    return {
        min,
        max,
        mid
    };
}

// =======================
//     Value Watcher
// =======================
// Constructor function to watch for changes in a value
function ValueWatcher(value) {
    this.onBeforeSet = function () { };
    this.onAfterSet = function () { };

    this.setValue = function (newVal) {
        this.onBeforeSet(value, newVal);
        value = newVal;
        this.onAfterSet(newVal);
    };

    this.getValue = function () {
        return value;
    };
}
// =======================
//     Check Duplicates
// =======================
async function checkDuplicates() {
    // get Announcements IDs
    let idsArray = [];
    let data = await fs_handler('./scrap_api/data/fullDB_main_api.json');
    data?.forEach((obj) => {
        obj?.data?.search?.announcements?.data?.forEach(element => {
            idsArray.push(element?.id);
        });
    });

    // find duplicates
    const uniqueNumbersSet = new Set();
    const duplicatesSet = new Set();

    for (const num of idsArray) {
        if (uniqueNumbersSet.has(num)) {
            duplicatesSet.add(num);
        } else {
            uniqueNumbersSet.add(num);
        }
    }
    const duplicates = Array.from(duplicatesSet)
    const uniqueNumbers = idsArray.filter(num => !duplicates.includes(num));

    console.log('Announcements Qte: ', idsArray.length);
    console.log("Duplicates:", duplicates.length);
    console.log("Unique Numbers:", uniqueNumbers.length);

    return { duplicates, uniqueNumbers }
}
// =======================
//    Check Connection
// =======================
async function checkConnection() {
    const pingUrl = 'https://www.google.com'; // Use a reliable URL for checking connectivity
    const maxRetries = 0; // Maximum number of retries
    const checkDelay = 15; // in seconds

    let retries = 0;

    while (retries < maxRetries || !maxRetries) {
        console.log('\n Retry Connecting: ' + retries + '/' + maxRetries)
        try {
            await fetch(pingUrl);
            console.log('Connection is back!');
            return true;
        } catch (error) {
            console.error('Error No Connection yet');
            retries++;
            await new Promise(resolve => setTimeout(resolve, checkDelay * 1000)); // Wait for 5 seconds before retrying
        }
    }
    logWithColor('Scripts are stoping: NO INTERNET CONNECTION ON YOU MACHINE!', 'red')
    process.exit(1); // Exit with failure status code
}

export { fs_handler, ValueWatcher, createLinkDictionary, checkConnection, checkDuplicates, getMinMaxMid, getFuncDuration, progress, showInfiniteLoadingBar, logWithColor };