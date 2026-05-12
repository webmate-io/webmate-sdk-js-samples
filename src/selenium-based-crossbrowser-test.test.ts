import * as webdriverio from "webdriverio";
import logger from "@wdio/logger";
import "mocha";
import { should } from "chai";
import { mergeMap, tap } from "rxjs/operators";
import * as Webmate from "webmate-sdk-js";
import {
    Browser,
    BrowserType,
    BrowserSessionId,
    CrossbrowserJobInput,
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
 * TypeScript counterpart of the Java SeleniumBasedCrossbrowserTest sample.
 *
 * Runs the same Selenium script in two browsers (Chrome and Firefox), captures
 * a BrowserSessionId from each, then asks webmate to compare their layouts via
 * the CrossbrowserLayoutAnalysis job. The Java SDK uses OfflineExpeditionSpec
 * + ExpeditionComparisonCheckBuilder for the same thing; the JS SDK exposes
 * the equivalent through JobEngine.startKnownJob with CrossbrowserJobInput.
 */
describe("Crossbrowser - Selenium based", function () {
    this.timeout(600000);

    const log = logger("tests:selenium-crossbrowser");

    let webmateSession: WebmateAPISession;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    it("should compare layouts in Chrome and Firefox", async function () {
        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const refId    = await executeTestInBrowser(new Browser(BrowserType.CHROME,  "106", platform));
        const compare  = await executeTestInBrowser(new Browser(BrowserType.FIREFOX, "106", platform));

        const jobRunId = await webmateSession.jobEngine.startKnownJob(
            "Selenium based crossbrowser comparison",
            new CrossbrowserJobInput(refId, [compare]),
            MY_WEBMATE_PROJECTID).toPromise();

        log.info(`Started CrossbrowserLayoutAnalysis job: ${jobRunId}`);
    });

    async function executeTestInBrowser(browser: Browser): Promise<BrowserSessionId> {
        const browserObj: BrowserObject = await webdriverio.remote({
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
            logLevel: "info",
        });

        const seleniumSession: WebmateSeleniumSession =
            webmateSession.addSeleniumSession(browserObj.sessionId);
        const browserSessionId = await seleniumSession.getBrowserSessionId().toPromise();

        try {
            await browserObj.url("http://www.examplepage.org/form_interaction");

            await (await browserObj.$("#lk")).click();
            await webmateSession.browserSession.createState("after link").toPromise();
            await (await browserObj.$("#bn")).click();
            await (await browserObj.$("#ck")).click();
            await (await browserObj.$("#rd")).click();
            await webmateSession.browserSession.createState("after radio button").toPromise();

            await seleniumSession
                .finishTestRun(TestRunEvaluationStatus.PASSED, "TestRun completed")
                .toPromise();
        } catch (err) {
            await seleniumSession
                .finishTestRun(TestRunEvaluationStatus.FAILED, "TestRun has failed")
                .toPromise();
            throw err;
        } finally {
            await browserObj.deleteSession();
        }

        return browserSessionId;
    }
});
