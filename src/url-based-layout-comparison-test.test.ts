import * as webdriverio from "webdriverio";
import logger from "@wdio/logger";
import "mocha";
import { should } from "chai";
import * as Webmate from "webmate-sdk-js";
import {
    Browser,
    BrowserType,
    BrowserSessionId,
    Platform,
    PlatformType,
    RegressionJobInput,
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
 * TypeScript counterpart of the Java UrlBasedLayoutComparisonTest sample.
 *
 * Walks two URL lists with the same browser, capturing a BrowserSession for
 * each set, then asks webmate to compare the resulting layouts. Useful for
 * release-A vs release-B regression checks where the only thing that changed
 * is the URL the user lands on.
 */
describe("URL Based Layout Comparison Test", function () {
    this.timeout(600000);

    const log = logger("tests:url-based-layout-comparison");

    // docs:start urls
    const referenceUrls = [
        "http://examplepage.org/index.html",
        "http://examplepage.org/version/current",
    ];

    const compareUrls = [
        "http://examplepage.org/index_alternative.html",
        "http://examplepage.org/version/future",
    ];
    // docs:end urls

    let webmateSession: WebmateAPISession;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    // docs:start compare
    it("should compare two URL sets in Chrome", async function () {
        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const browser  = new Browser(BrowserType.CHROME, "106", platform);

        const refId    = await visitUrls(referenceUrls, browser);
        const compare  = await visitUrls(compareUrls, browser);

        const jobRunId = await webmateSession.jobEngine.startKnownJob(
            "URL based layout comparison",
            new RegressionJobInput(refId, compare),
            MY_WEBMATE_PROJECTID).toPromise();

        log.info(`Started RegressionLayoutAnalysis job: ${jobRunId}`);
    });
    // docs:end compare

    // docs:start walk-urls
    async function visitUrls(urls: string[], browser: Browser): Promise<BrowserSessionId> {
        const browserObj: BrowserObject = await webdriverio.remote({
            capabilities: {
                browserName: browser.browserType,
                version: browser.version,
                platform: browser.platform.toString(),
                // @ts-ignore
                apikey: MY_WEBMATE_APIKEY,
                project: MY_WEBMATE_PROJECTID,
                "wm:name": "Regression Test",
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
            for (let i = 0; i < urls.length; i++) {
                await browserObj.url(urls[i]);
                await webmateSession.browserSession.createState(`Page ${i}`).toPromise();
            }
        } finally {
            await browserObj.deleteSession();
        }
        return browserSessionId;
    }
    // docs:end walk-urls
});
