# api-usage-extractor

A simple API Usage Extractor for Salesforce. This application was made to automatically query, extract, scan and report on the API calls made using a legacy API version in Salesforce.

# requirements
- [nodejs](https://nodejs.org/en)
- [salesforce-cli](https://developer.salesforce.com/tools/sfdxcli)

# how to use
- Download zip or clone the repository
- Extract zip if needed
- Go to the folder directory containing the `app.js` file, right click in an empty area and click `Open in Terminal` (to launch Windows PowerShell), or `Git Bash Here` (if you have Git installed).
- Type `npm install`. Press Enter
- Type `node app.js`. Press Enter
- Choose an environment and login to your org

If there were detected legacy API calls to Salesforce, it will create a .csv file containing the logs of the API call. It is saved by default in your USER folder.

# launch options

To use launch options, just append the argument after the `node app.js` command. e.g.: `node app.js --extractall --offset 5 --limit 5`

### `--extractall`
- allows you to extract all the CSV log files into a folder.

### `--limit <n>`
- allows you to limit up to `n` rows of the log files to be exported.

### `--offset <n>`
- allows you to set the offset to `n` rows of the log files to be exported.

# for large orgs

If you encounter `JavaScript Heap Out of Memory` error, this is normal as we are dealing csv files with very large file sizes. We can utilize the LIMIT and OFFSET arguments to scan a few files and the others at a later time.

Usage:

`node app.js --limit <limit> --offset <offset>`

We recommend starting at the `limit` of 5 and `offset` of 0, incrementing the `offset` with every run by 5. For example:

First run: `node app.js --limit 5 --offset 0`<br />
Second run: `node app.js --limit 5 --offset 5`<br />
Third run: `node app.js --limit 5 --offset 10`<br />

so on and so forth...
