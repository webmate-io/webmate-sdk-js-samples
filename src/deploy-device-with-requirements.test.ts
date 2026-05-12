import "mocha";
import { should } from "chai";
import logger from "@wdio/logger";
import * as Webmate from "webmate-sdk-js";
import {
    DeviceRequest,
    DeviceRequirements,
    DevicePropertyNames,
    WebmateAPISession,
} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    WEBMATE_API_URL,
} from "./credentials";
should();

/**
 * TypeScript counterpart of the Java DeployDeviceWithRequirements sample.
 *
 * Each `it` block demonstrates one way to phrase a DeviceRequest: by platform,
 * by model, by browser, by language, or by a combination. Every test releases
 * the device in an afterEach hook to keep the project's device pool clean.
 */
describe("Deploy Device With Requirements", function () {
    this.timeout(600000);

    const log = logger("tests:deploy-device");

    let webmateSession: WebmateAPISession;
    let lastDeviceId: string | undefined;

    before(function () {
        webmateSession = Webmate.startSession(
            MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    afterEach(async function () {
        if (lastDeviceId) {
            await webmateSession.device.releaseDevice(lastDeviceId).toPromise();
            lastDeviceId = undefined;
        }
    });

    async function deploy(name: string, reqs: DeviceRequirements): Promise<void> {
        const request = new DeviceRequest(name, reqs);
        const device  = await webmateSession.device
            .requestDeviceByRequirements(MY_WEBMATE_PROJECTID, request).toPromise();
        lastDeviceId = device.id;
        log.info(`Deployed device ${device.id} (${name}) in state ${device.state}`);
    }

    it("deploys by platform requirement", async function () {
        await deploy("Platform Device", new Map([
            [DevicePropertyNames.Platform, "Android_13"],
        ]));
    });

    it("deploys by model requirement", async function () {
        await deploy("Model Device", new Map([
            [DevicePropertyNames.Model, "iPhone 11"],
        ]));
    });

    it("deploys by browser requirement", async function () {
        await deploy("Browser Device", new Map<string, any>([
            [DevicePropertyNames.Browsers, { browserType: "CHROME", version: "116" }],
        ]));
    });

    it("deploys by language requirement", async function () {
        await deploy("Language Device", new Map<string, any>([
            [DevicePropertyNames.Platform, "WINDOWS_11_64"],
            [DevicePropertyNames.Language, "de"],
        ]));
    });

    it("deploys by combined requirements", async function () {
        await deploy("Combined Mobile Device", new Map<string, any>([
            [DevicePropertyNames.Platform, "Android_12"],
            [DevicePropertyNames.Model,    "Galaxy Tab A8"],
            [DevicePropertyNames.Browsers, { browserType: "CHROME", version: "120" }],
        ]));
    });
});
