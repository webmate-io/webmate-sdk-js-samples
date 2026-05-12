import * as fs from "fs";
import * as path from "path";
import * as webdriverio from "webdriverio";
import logger from "@wdio/logger";
import "mocha";
import { should } from "chai";
import * as Webmate from "webmate-sdk-js";
import {
    DeviceDTO,
    DeviceRequest,
    DevicePropertyNames,
    WebmateAPISession,
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
 * TypeScript counterpart of the Java AppiumTestWithUpload sample.
 *
 * Runs in two ordered phases: the first request a Galaxy A52 5G device, uploads
 * the bundled sample.apk via the package management API, installs it on the
 * device, then deletes the project-side package copy. The second drives the
 * installed app through WebdriverIO's Appium protocol. Tests must run in the
 * order they appear here — the alphabetical file/test ordering Mocha uses by
 * default is enough to enforce that as long as you don't reorder the `it`s.
 */
describe("Appium Test With Upload", function () {
    this.timeout(900000);

    const log = logger("tests:appium-upload");
    const APK_PATH = path.resolve(__dirname, "res", "sample.apk");

    let webmateSession: WebmateAPISession;
    let device: DeviceDTO;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    after(async function () {
        if (device) {
            await webmateSession.device.releaseDevice(device.id).toPromise();
        }
    });

    it("a_deployAndroidDeviceAndInstallApp", async function () {
        const request = new DeviceRequest("Sample Device", new Map<string, any>([
            [DevicePropertyNames.Model,                "Galaxy A52 5G"],
            [DevicePropertyNames.AutomationAvailable,  true],
        ]));
        device = await webmateSession.device
            .requestDeviceByRequirements(MY_WEBMATE_PROJECTID, request).toPromise();

        if (!fs.existsSync(APK_PATH)) {
            throw new Error(`Missing sample.apk at ${APK_PATH}`);
        }
        const pkg = await webmateSession.packages
            .uploadPackage(MY_WEBMATE_PROJECTID, APK_PATH, "Material example app", "apk")
            .toPromise();

        await webmateSession.device.installAppOnDevice(device.id, pkg.id).toPromise();
        log.info(`App ${pkg.id} installed on device ${device.id}`);
    });

    it("b_performTest", async function () {
        const browserObj: BrowserObject = await webdriverio.remote({
            capabilities: {
                browserName: "Appium",
                // @ts-ignore
                "wm:model": "Galaxy A52 5G",
                "wm:apikey": MY_WEBMATE_APIKEY,
                "wm:project": MY_WEBMATE_PROJECTID,
                "appium:appPackage":  "com.afollestad.materialdialogssample",
                "appium:appActivity": "com.afollestad.materialdialogssample.MainActivity",
                "wm:video": true,
                "wm:name": "Demo Appium Test",
            },
            hostname: WEBMATE_SELENIUM_HOST,
            protocol: WEBMATE_SELENIUM_PROTOCOL,
            port: WEBMATE_SELENIUM_PORT,
            connectionRetryTimeout: 240000,
            connectionRetryCount: 1,
            logLevel: "info",
        });

        try {
            const basicButtons = await browserObj.$("id=com.afollestad.materialdialogssample:id/basic_buttons");
            await basicButtons.waitForExist();
            await basicButtons.click();

            const agree = await browserObj.$('android=new UiSelector().textContains("AGREE")');
            await agree.click();
        } finally {
            await browserObj.deleteSession();
        }
    });
});
