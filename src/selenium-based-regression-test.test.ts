import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
 * TypeScript counterpart of the Java SeleniumBasedRegressionTest sample.
 *
 * The first run executes a Selenium scenario and persists its BrowserSessionId
 * to ~/webmate_referencesession_id.txt as the baseline. Every subsequent run
 * loads that ID back and submits a RegressionLayoutAnalysis job comparing the
 * fresh expedition against the saved reference. Tests must run in order — the
 * test file names rely on Mocha's natural alphabetical order to enforce it.
 */
describe("Selenium - Regression Test", function () {
    this.timeout(600000);

    const log = logger("tests:regression");
    const REFERENCE_FILE = path.join(os.homedir(), "webmate_referencesession_id.txt");

    let webmateSession: WebmateAPISession;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    function saveReferenceSessionId(id: BrowserSessionId): void {
        fs.writeFileSync(REFERENCE_FILE, id, "utf8");
    }

    function getReferenceSessionId(): BrowserSessionId | undefined {
        if (!fs.existsSync(REFERENCE_FILE)) return undefined;
        return fs.readFileSync(REFERENCE_FILE, "utf8").trim();
    }

    it("aCreateReferenceExpedition", async function () {
        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const browser  = new Browser(BrowserType.CHROME, "106", platform);

        const referenceId = await executeTest(browser);
        saveReferenceSessionId(referenceId);
        log.info(`Saved reference BrowserSessionId to ${REFERENCE_FILE}`);
    });

    it("bCreateExpeditionAndCompareWithReference", async function () {
        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const browser  = new Browser(BrowserType.CHROME, "106", platform);

        const comparisonId = await executeTest(browser);
        const referenceId  = getReferenceSessionId();
        if (!referenceId) {
            throw new Error(`No baseline found at ${REFERENCE_FILE}; run aCreateReferenceExpedition first`);
        }

        const jobRunId = await webmateSession.jobEngine.startKnownJob(
            "Example Regression Test",
            new RegressionJobInput(referenceId, comparisonId),
            MY_WEBMATE_PROJECTID).toPromise();

        log.info(`Started RegressionLayoutAnalysis job: ${jobRunId}`);
    });

    async function executeTest(browser: Browser): Promise<BrowserSessionId> {
        const browserObj: BrowserObject = await webdriverio.remote({
            capabilities: {
                browserName: browser.browserType,
                version: browser.version,
                platform: browser.platform.toString(),
                // @ts-ignore
                apikey: MY_WEBMATE_APIKEY,
                project: MY_WEBMATE_PROJECTID,
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
            await browserObj.url("http://www.examplepage.org/version/future");
            await webmateSession.browserSession.createState("after click").toPromise();

            await browserObj.url("http://www.examplepage.org/form_interaction");
            await (await browserObj.$("#lk")).click();
            await webmateSession.browserSession.createState("after link").toPromise();
            await (await browserObj.$("#bn")).click();
            await (await browserObj.$("#ck")).click();
            await (await browserObj.$("#rd")).click();
            await webmateSession.browserSession.createState("after radio button").toPromise();
        } finally {
            await browserObj.deleteSession();
        }
        return browserSessionId;
    }
});
