import * as webdriverio from "webdriverio";
import logger from "@wdio/logger";
import "mocha";
import { should } from "chai";
import * as Webmate from "webmate-sdk-js";
import {
    Browser,
    BrowserType,
    BrowserSessionRef,
    Platform,
    PlatformType,
    TestRunEvaluationStatus,
    WebmateAPISession,
    WebmateSeleniumSession,
} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    WEBMATE_API_URL,
    WEBMATE_SELENIUM_HOST,
    WEBMATE_SELENIUM_PORT,
    WEBMATE_SELENIUM_PROTOCOL,
} from "./credentials";
import BrowserObject = WebdriverIO.BrowserObject;
should();

/**
 * Mocha equivalent of the Java SeleniumTestWithActionRule sample. Each `it`
 * block runs as a plain Selenium test; the `beforeEach` / `afterEach` hooks
 * play the role of the JUnit @Rule, automatically opening and closing a
 * webmate action around every test method. If any test fails, the test run
 * is finished as FAILED in `after()`.
 */
describe("Selenium Test With Action Rule", function () {
    this.timeout(600000);

    const log = logger("tests:action-rule");

    let webmateSession: WebmateAPISession;
    let seleniumSession: WebmateSeleniumSession;
    let browserObj: BrowserObject;
    let browserSession: BrowserSessionRef;
    let hasAtLeastOneTestFailed = false;

    before(async function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);

        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const browser = new Browser(BrowserType.CHROME, "106", platform);

        browserObj = await webdriverio.remote({
            capabilities: {
                browserName: browser.browserType,
                version: browser.version,
                platform: browser.platform.toString(),
                // @ts-ignore
                apikey: MY_WEBMATE_APIKEY,
                project: MY_WEBMATE_PROJECTID,
                "wm:autoScreenshots": true,
            },
            hostname: WEBMATE_SELENIUM_HOST,
            protocol: WEBMATE_SELENIUM_PROTOCOL,
            port: WEBMATE_SELENIUM_PORT,
            connectionRetryTimeout: 240000,
            connectionRetryCount: 1,
            logLevel: "debug",
        });

        seleniumSession = webmateSession.addSeleniumSession(browserObj.sessionId);
        const browserSessionId = await seleniumSession.getBrowserSessionId().toPromise();
        browserSession = new BrowserSessionRef(browserSessionId, webmateSession);
    });

    after(async function () {
        try {
            if (hasAtLeastOneTestFailed) {
                await seleniumSession
                    .finishTestRun(TestRunEvaluationStatus.FAILED, "TestRun has failed")
                    .toPromise();
            } else {
                await seleniumSession
                    .finishTestRun(TestRunEvaluationStatus.PASSED, "Successful.")
                    .toPromise();
            }
        } finally {
            if (browserObj) {
                await browserObj.deleteSession();
            }
        }
    });

    // The hook pair below replays the Java JUnit @Rule behaviour: every test
    // method is automatically wrapped in a named webmate action, finished
    // successfully on pass and as a failure on fail.
    beforeEach(async function (this: any) {
        await browserSession.startAction(this.currentTest.title).toPromise();
    });

    afterEach(async function (this: any) {
        if (this.currentTest.state === "passed") {
            await browserSession.finishAction("ok").toPromise();
        } else {
            hasAtLeastOneTestFailed = true;
            await browserSession
                .finishActionAsFailure(`${this.currentTest.title} failed`)
                .toPromise();
        }
    });

    it("redirectTest", async function () {
        await browserObj.url("http://www.examplepage.org/version/future");
        const nav = await browserObj.$("#goto-examplepage");
        await nav.waitForExist();
        await nav.click();
        (await browserObj.getTitle()).should.equal("Cross Browser Issues Example");
    });

    it("formTest", async function () {
        await browserObj.url("http://www.examplepage.org/form_interaction");

        const link = await browserObj.$("#lk");
        await link.click();
        (await (await browserObj.$(".success")).getText()).should.equal("Link Clicked!");

        await (await browserObj.$("#bn")).click();
        await (await browserObj.$("#ck")).click();
        await (await browserObj.$("#rd")).click();

        const input = await browserObj.$("#text-input");
        await input.click();
        await input.setValue("Test test");

        const area = await browserObj.$("#area");
        await area.click();
        await area.setValue("Here some more test");

        log.info("formTest complete");
    });
});
