import * as webdriverio from 'webdriverio';
import logger from '@wdio/logger';
import 'mocha';
import {should} from 'chai';
import * as Webmate from "webmate-sdk-js";
import {Browser, BrowserType, Platform, PlatformType, TestRunEvaluationStatus, WebmateAPISession} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    MY_WEBMATE_USER,
    WEBMATE_API_URL,
    WEBMATE_SELENIUM_HOST,
    WEBMATE_SELENIUM_PORT,
    WEBMATE_SELENIUM_PROTOCOL
} from "./credentials";
import BrowserObject = WebdriverIO.BrowserObject;
should();

describe('Selenium Demo Test Suite', function () {

    let log = logger('tests:selenium');

    let webmateSession: WebmateAPISession;

    // time out for test execution
    this.timeout(600000);

    before(function () {
        // The user data can be configured in credentials.ts
        webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    it('should execute a simple selenium test', async() => {
        let errorHandler = function (e) {
            log.error(`An error occurred ${e}`);
            throw e;
        };

        let platform = new Platform(PlatformType.WINDOWS, "10", "64");
        let browser = new Browser(BrowserType.CHROME, "83", platform);
        await executeTestInBrowser(browser).catch(errorHandler);
    });

    function getOptions(browser: Browser): WebdriverIO.RemoteOptions {
        return {
            capabilities: {
                browserName: browser.browserType,
                version: browser.version,
                platform: browser.platform.toString(),
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
    }

    async function executeTestInBrowser(browser: Browser) {
        log.info(`Starting test for ${browser.browserType} ${browser.version} on ${browser.platform.toString()}`);
        let options = getOptions(browser);
        const browserObj: BrowserObject = await webdriverio.remote(options);

        let urlExamplePageFuture: string = "http://www.examplepage.org/version/future";
        log.info("Navigating to ", urlExamplePageFuture);
        await browserObj.url(urlExamplePageFuture);
        let seleniumSession = webmateSession.addSeleniumSession(browserObj.sessionId);

        try {
            await webmateSession.browserSession.createState("initial state").toPromise();

            log.info("Clicking on something that will redirect us...");
            let navlink = await browserObj.$("#goto-examplepage");
            await navlink.waitForExist();
            await navlink.click();
            let title = await browserObj.getTitle();
            title.should.eq("Cross Browser Issues Example", "Page title is incorrect");

            let urlExamplePageFormInteraction = "http://www.examplepage.org/form_interaction";
            log.info("Navigate to ", urlExamplePageFormInteraction);
            await browserObj.url(urlExamplePageFormInteraction);

            log.info("Click on link");
            let link = await browserObj.$("#lk");
            await link.click();
            let successBox = await browserObj.$(".success");
            await successBox.isExisting();
            let sucText = await successBox.getText();
            sucText.should.equal("Link Clicked!", "Success text was wrong");

            await webmateSession.browserSession.createState("after link").toPromise();

            await webmateSession.browserSession.startAction("Click on button").toPromise();
            log.info("Clicking button");
            let bn = await browserObj.$("#bn");
            await bn.click();
            await webmateSession.browserSession.finishAction().toPromise();

            await webmateSession.browserSession.startAction("Click on checkbox").toPromise();
            log.info("Clicking on checkbox");
            let ck = await browserObj.$("#ck");
            await ck.click();
            await webmateSession.browserSession.finishAction().toPromise();

            await webmateSession.browserSession.startAction("Click on radio button").toPromise();
            log.info("Clicking radio button");
            let rd = await browserObj.$("#rd");
            await rd.click();

            await webmateSession.browserSession.createState("after radio button").toPromise();
            await webmateSession.browserSession.finishAction("was successful").toPromise();

            log.info("Clicking on element with hover event");
            let mover = await browserObj.$("#mover");
            await mover.click();

            log.info("Entering some text...");
            let input = await browserObj.$("#text-input");
            await input.click();
            await input.setValue("Test test");

            log.info("Entering some more text...");
            let area = await browserObj.$("#area");
            await area.click();
            await area.setValue("Here some more test");

            await seleniumSession.finishTestRun(TestRunEvaluationStatus.PASSED, "TestRun completed successfully").toPromise();
            log.info("Selenium expedition completed");
        } catch (err) {
            await seleniumSession.finishTestRun(TestRunEvaluationStatus.FAILED, "TestRun has failed").toPromise();
            // Rethrow the error
            throw err;
        } finally {
            await browserObj.deleteSession();
        }

        return browserObj.sessionId;
    }
});

