const prompt = require("prompt-sync")({ sigint: true });
const sfdx = require("sfdx-node");
const fetch = require("node-fetch");
const csv = require("csvtojson");
const fs = require("fs");
var parseArgs = require("minimist");

const DEPRECATED_API_VERSIONS = [
    "21.0",
    "22.0",
    "23.0",
    "24.0",
    "25.0",
    "26.0",
    "27.0",
    "28.0",
    "29.0",
    "30.0"
];

var argv = parseArgs(process.argv.slice(2));
const offset = argv["offset"];
const limit = argv["limit"];

console.log("Please select your environment: ");
console.log("[P] Production");
console.log("[S] Sandbox");
console.log("Or alternatively, you can also manually input your login URL.");

let choice = prompt("");
if (choice.toUpperCase() === "P") {
    loginUrl = "https://login.salesforce.com";
} else if (choice.toUpperCase() === "S") {
    loginUrl = "https://test.salesforce.com";
} else {
    loginUrl = choice;
}

if (loginUrl.search(/^https?\:\/\//) == -1) {
    loginUrl = "https://" + loginUrl;
}

let logsScanned = 0;

sfdx.auth.web
    .login({
        instanceurl: loginUrl,
    })
    .then((login) => {
        console.log("Successfully logged into " + login.username);
        let query =
            "SELECT LogFile, EventType, CreatedDate FROM EventLogFile WHERE EventType IN ('API', 'RestApi', 'ApiTotalUsage')";
        if (limit) {
            query += ` LIMIT ${limit}`;
        }
        if (offset) {
            query += ` OFFSET ${offset}`;
        }
        sfdx.force.data
            .soqlQuery({
                query: query,
                targetusername: login.username,
                json: true,
            })
            .then((eventLogFile) => {
                console.log("Parsing Event Log files...");
                let requests = [];
                eventLogFile.records.forEach((logFile, index) => {
                    requests.push(
                        fetch(login.instanceUrl + logFile.LogFile, {
                            method: "GET",
                            headers: {
                                "content-type": "text/csv",
                                authorization: "Bearer " + login.accessToken,
                            },
                        })
                    );
                });
                Promise.all(requests)
                    .then((responses) => {
                        return Promise.all(
                            responses.map((response) => response.text())
                        );
                    })
                    .then((data) => {
                        let csvs = [];
                        let offenders = [];
                        data.forEach((csvFile) => {
                            csvs.push(csv().fromString(csvFile));
                        });
                        Promise.all(csvs)
                            .then((allJsonData) => {
                                allJsonData.forEach((jsonData) => {
                                    jsonData.forEach((apiCall) => {
                                        logsScanned += 1;
                                        if (apiCall.EVENT_TYPE === "RestApi") {
                                            if (
                                                DEPRECATED_API_VERSIONS.includes(
                                                    apiCall.URI.split(
                                                        "/"
                                                    )[3].replace("v", "")
                                                )
                                            ) {
                                                offenders.push(apiCall);
                                            }
                                        } else if (
                                            apiCall.EVENT_TYPE === "API"
                                        ) {
                                            if (
                                                ["E", "P"].includes(
                                                    apiCall.API_TYPE
                                                ) &&
                                                DEPRECATED_API_VERSIONS.includes(
                                                    apiCall.API_VERSION
                                                )
                                            ) {
                                                offenders.push(apiCall);
                                            }
                                        } else {
                                            if (apiCall.API_VERSION) {
                                                if (
                                                    DEPRECATED_API_VERSIONS.includes(
                                                        apiCall.API_VERSION
                                                    )
                                                ) {
                                                    offenders.push(apiCall);
                                                }
                                            }
                                        }
                                    });
                                });
                                console.log(
                                    `Finished scanning ${logsScanned} logs.`
                                );
                                if (offenders.length) {
                                    let filePath = `${require("path").join(
                                        require("os").homedir(),
                                        ""
                                    )}\\api_usage_report_${Math.floor(
                                        new Date().getTime() / 1000
                                    )}.csv`;

                                    const items = offenders;
                                    const replacer = (key, value) =>
                                        value === null ? "" : value; // specify how you want to handle null values here
                                    const header = Object.keys(items[0]);
                                    const csv = [
                                        header.join(","), // header row first
                                        ...items.map((row) =>
                                            header
                                                .map((fieldName) =>
                                                    JSON.stringify(
                                                        row[fieldName],
                                                        replacer
                                                    )
                                                )
                                                .join(",")
                                        ),
                                    ].join("\r\n");

                                    fs.writeFile(filePath, csv, (err) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log(
                                                "There were some API calls made with the legacy version of the Salesforce API."
                                            );
                                            console.log(
                                                "You can check the logs in the file " +
                                                    filePath
                                            );
                                        }
                                    });
                                } else {
                                    console.log(
                                        "There were no API calls made with the legacy version of the Salesforce API."
                                    );
                                }
                            })
                            .catch((err) => console.log(err));
                    })
                    .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
    })
    .catch((err) => {
        console.log(err);
    });
