# api-usage-extractor

A simple API Usage Extractor for Salesforce. This application was made to automatically query, extract, scan and report on the API calls made using a legacy API version in Salesforce.

# requirements
- [nodejs](https://nodejs.org/en)
- [salesforce-cli](https://developer.salesforce.com/tools/sfdxcli)

# how to use
- Download zip
- Extract
- Go to the extracted files, right in an empty area and click `Open in Terminal`
- Type `npm install`. Press Enter
- Type `node app.js`. Press Enter
- Choose an environment and login to your org

If there were detected legacy API calls to Salesforce, it will create a .csv file containing the logs of the API call. It is saved by default in your USER folder.

# for large orgs

If you encounter `JavaScript Heap Out of Memory` error, this is normal as we are dealing csv files with very large file sizes. We can utilize the LIMIT and OFFSET arguments to scan a few files and the others at a later time.

Usage:

`node app.js --limit <limit> --offset <offset>`

We recommend starting at the `limit` of 5 and `offset` of 0, incrementing the `offset` with every run by 5. For example:

First run: `node app.js --limit 5 --offset 0`<br />
Second run: `node app.js --limit 5 --offset 5`<br />
Third run: `node app.js --limit 5 --offset 10`<br />

so on and so forth...
