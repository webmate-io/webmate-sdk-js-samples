import * as webdriverio from "webdriverio";
import logger from "@wdio/logger";
import "mocha";
import { should } from "chai";
import * as Webmate from "webmate-sdk-js";
import {
    Browser,
    BrowserType,
    DeviceDTO,
    DeviceRequest,
    DevicePropertyNames,
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
 * TypeScript counterpart of the Java SeleniumTestScheduling sample.
 *
 * Requests a device explicitly, waits for it to reach the running state,
 * then pins the Selenium session to that exact slot via the wm:slot
 * capability. This avoids the contention that arises in shared device
 * pools when many tests are deployed in parallel.
 */
describe("Selenium Test Scheduling", function () {
    this.timeout(600000);

    const log = logger("tests:scheduling");

    let webmateSession: WebmateAPISession;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    it("schedules a device and runs the test on its slot", async function () {
        const platform = new Platform(PlatformType.WINDOWS, "11", "64");
        const browser  = new Browser(BrowserType.CHROME, "121", platform);

        const device = await scheduleDevice("TestDevice", browser, 5);
        if (!device) throw new Error("No device could be scheduled");

        // docs:start release
        try {
            await executeTestOnSlot(browser, device.slot);
        } finally {
            await webmateSession.device.releaseDevice(device.id).toPromise();
        }
        // docs:end release
    });

    // docs:start schedule
    async function scheduleDevice(name: string, browser: Browser, maxRetries: number): Promise<DeviceDTO | undefined> {
        const platformStr = `${browser.platform.platformType}_${browser.platform.platformVersion}_${browser.platform.platformArchitecture}`;
        const requirements = new Map<string, any>([
            [DevicePropertyNames.Platform,             platformStr],
            [DevicePropertyNames.AutomationAvailable,  true],
            [DevicePropertyNames.Browsers, { browserType: browser.browserType, version: browser.version }],
        ]);
        const request = new DeviceRequest(name, requirements);

        let device: DeviceDTO | undefined;
        let state = "";
        let retries = 0;

        while ((!device || state !== "running") && retries < maxRetries) {
            try {
                device = await webmateSession.device
                    .requestDeviceByRequirements(MY_WEBMATE_PROJECTID, request).toPromise();
                while (!device || state !== "running") {
                    await new Promise(r => setTimeout(r, 60000));
                    if (device) {
                        const info = await webmateSession.device.getDeviceInfo(device.id).toPromise();
                        state = info.state;
                    }
                }
            } catch (e) {
                log.warn(`Could not get device, will retry: ${e}`);
                await new Promise(r => setTimeout(r, 60000));
                retries++;
            }
        }
        return device;
    }
    // docs:end schedule

    async function executeTestOnSlot(browser: Browser, slot: string): Promise<void> {
        // docs:start pin-slot
        const browserObj: BrowserObject = await webdriverio.remote({
            capabilities: {
                browserName: browser.browserType,
                browserVersion: browser.version,
                platformName: browser.platform.toString(),
                // @ts-ignore
                "wm:apikey": MY_WEBMATE_APIKEY,
                "wm:project": MY_WEBMATE_PROJECTID,
                "wm:slot": slot,
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
        // docs:end pin-slot

        try {
            await browserObj.url("http://www.examplepage.org/form_interaction");
            await (await browserObj.$("#lk")).click();
            await (await browserObj.$("#bn")).click();
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
    }
});
