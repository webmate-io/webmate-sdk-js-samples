import * as webdriverio from 'webdriverio';
import 'mocha';
import { should } from 'chai';
import {
    BrowserSessionId,
    BrowserSessionStateExtractionConfig, CrossbrowserJobInput, OptViewPortDimension,
    ScreenshotConfig,
    WarmUpConfig,
    WebmateAPISession
} from "webmate-sdk-js";
import * as Webmate from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY, MY_WEBMATE_PROJECTID, MY_WEBMATE_USER,
    WEBMATE_API_URL,
    WEBMATE_SELENIUM_HOST,
    WEBMATE_SELENIUM_PORT,
    WEBMATE_SELENIUM_PROTOCOL
} from "./credentials";
import {delay, mergeMap, tap} from "rxjs/operators";
import {combineLatest, of, throwError} from "rxjs";
import {ArtifactType} from "webmate-sdk-js/dist/src/artifact/artifact-types";
should();


// skipping this test run until configuring headless chrome for travis CI
describe('Selenium Demo Test Suite', function () {
    let sessionIds: BrowserSessionId[] = [];
    let webmateSession: WebmateAPISession;


    // time out for test execution
    this.timeout(600000);

    let defaultWebdriverIOOptions: WebdriverIO.RemoteOptions = {
        capabilities: {
            browserName: 'chrome',
            version: '72',
            platform: 'WINDOWS_10_64',
            // @ts-ignore
            email: MY_WEBMATE_USER,
            apikey: MY_WEBMATE_APIKEY,
            project: MY_WEBMATE_PROJECTID
        },
        hostname: WEBMATE_SELENIUM_HOST,
        protocol: WEBMATE_SELENIUM_PROTOCOL,
        port: WEBMATE_SELENIUM_PORT,
        connectionRetryTimeout: 240000,
        connectionRetryCount: 1,
        logLevel: 'debug'
    };

    let config: BrowserSessionStateExtractionConfig = new BrowserSessionStateExtractionConfig(undefined,
        1000, 2000, 240000, true,
        new WarmUpConfig(), new ScreenshotConfig(), new OptViewPortDimension(1600, 1000));


    before(function () {
        // The user data can be configured in credentials.ts
        webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL);
    });

    it('should create a crossbrowserjob for examplepage.org', async() => {
        let errorHandler = function (e) {
            console.error(`An error occured ${e}`)
        };
        // Execute a sample selenium test on several browsers
        await test('chrome', '77', 'WINDOWS_10_64').catch(errorHandler);
        await test('firefox', '70', 'WINDOWS_10_64').catch(errorHandler);

        // Select the first session as a reference session for the crossbrowser test
        console.log("Starting Crossbrowser Test for sessions ", sessionIds);
        let referenceSession = sessionIds[0];
        sessionIds.shift();

        // Get all screenshots created during the reference session
        await webmateSession.artifact.queryArtifacts(MY_WEBMATE_PROJECTID, [ArtifactType.fromString("Page.FullpageScreenshot")], undefined, referenceSession).pipe(
            mergeMap(artifacts => {
                console.log("Got", artifacts.length, "screenshots for reference session:");
                console.log(artifacts);
                // Start a crossbrowser job
                console.log("Starting Crossbrowser Job");
                return webmateSession.jobEngine.startKnownJob("Examplepage-Crossbrowsertest", new CrossbrowserJobInput(referenceSession, sessionIds), MY_WEBMATE_PROJECTID);
            }),
            mergeMap(jobrunId => {
                console.log("Successfully started CBT with id ", jobrunId);
                // Get the summary of the JobRun
                return webmateSession.jobEngine.getSummaryOfJobRun(jobrunId);
            }),
            // wait until test results are available
            delay(5000),
            mergeMap(summary => {
                console.log("Got summary for JobRun", summary);
                if (summary.testRunId) {
                    // If the test was run successfully, get the results. Also pass the summary along
                    return combineLatest([webmateSession.testmgmt.getTestResults(summary.testRunId), of(summary)]);
                } else {
                    return throwError(new Error("No testrun info available"));
                }
            }),
            mergeMap(results => {
                let testResults = results[0];
                let summary = results[1];
                console.log("Got Testresults", testResults.toJS());

                // Create a test mail
                return combineLatest([webmateSession.mailTest.createTestMailAddress(MY_WEBMATE_PROJECTID, summary.testRunId), of(summary)]);
            }),
            mergeMap( results => {
                let address = results[0];
                let summary = results[1];
                console.log("Generated test mail address", address);

                // Get mails from the testmail inbox. We expect this to be empty
                return webmateSession.mailTest.getMailsInTestRun(MY_WEBMATE_PROJECTID, summary.testRunId);
            }),
            tap(mails => {
                if (mails.length > 0) {
                    return throwError(new Error("There are emails for the newly generated test mail address"));
                }
                console.log("Got mails", mails);
                console.log("Finished")
            })).toPromise().catch(errorHandler);
    });


    async function test(browserName: string, version: string, platform: string) {
        console.log(`Starting test for ${browserName} ${version} on ${platform}`);
        let url: string = "http://www.examplepage.org/version/future";
        let options = defaultWebdriverIOOptions;

        if (options.capabilities) {
            options.capabilities.browserName = browserName;
            options.capabilities.platform = platform;
            options.capabilities.version = version;
        }

        let sessionId: BrowserSessionId;

        // Initialize selenium session
        const browser = await webdriverio.remote(options);


        // Get and store session id
        sessionId = browser.sessionId;

        console.log(`Got session Id ${sessionId}`);
        sessionIds.push(sessionId);

        // Navigate to example page
        console.log("Navigating to ", url);
        await browser.url(url);

        // Wait until container element is available, then click it
        console.log("Waiting for container element");
        let container = await browser.$(".container");
        await container.waitForExist();
        await container.click();

        // Create a state in webmate
        console.log("Creating State");
        await webmateSession.browserSession.createState(sessionId, "after click", undefined, config).toPromise();

        // Click link to leave page
        console.log("Navigate to frontpage");
        let navlink = await browser.$("#goto-examplepage");
        await navlink.click();

        // Check if the title of the page is correct
        let title = await browser.getTitle();
        title.should.eq("Cross Browser Issues Example", "Page title is incorrect");

        console.log("Navigate to interaction page")
        await browser.url("http://www.examplepage.org/form_interaction");

        // Click on link and check for success
        let link = await browser.$("#lk");
        await link.click();

        let successBox = await browser.$(".success");
        await successBox.isExisting();
        let sucText = await successBox.getText();
        sucText.should.equal("Link Clicked!", "Success text was wrong");

        // Create another webmate setate
        console.log("Creating State");
        await webmateSession.browserSession.createState(sessionId,"after link", undefined, config).toPromise();

        console.log("Clicking button");
        let bn = await browser.$("#bn");
        await bn.click();

        console.log("Clicking checkbox");
        let ck = await browser.$("#ck");
        await ck.click();

        console.log("Clicking radio button");
        let rd = await browser.$("#rd");
        await rd.click();

        // Create another webmate setate
        console.log("Creating State");
        await webmateSession.browserSession.createState(sessionId,"after radio button", undefined, config).toPromise();

        console.log("Clicking on element with hover");
        let mover = await browser.$("#mover");
        await mover.click();

        console.log("Entering some text");
        let input = await browser.$("#text-input");
        await input.click();
        await input.setValue("test");

        console.log("Entering some more text");
        let area = await browser.$("#area");
        await area.click();
        await area.setValue("test");


        console.log("Closing Session");
        await browser.deleteSession();

        return true;

    }
});

