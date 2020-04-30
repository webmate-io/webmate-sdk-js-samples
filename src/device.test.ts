import 'mocha';
import { should } from 'chai';
import {
    WebmateAPISession
} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    MY_WEBMATE_USER, WEBMATE_API_URL
} from "./credentials";
import * as Webmate from "webmate-sdk-js";
import {delay, map, mergeMap, retryWhen, take, tap} from "rxjs/operators";
import {concat, of, throwError} from "rxjs";
should();

describe('Webmate SDK', function () {
    let webmateSession: WebmateAPISession;

    // time out for test execution
    this.timeout(600000);

    // Helper, which queries the number of devices ever <timeout> milliseconds, <retries> times and checks if it equals <n>
    let waitForNumberOfDevices = (n: number, retries: number = 6, timeout: number = 10000) => of("").pipe(
        mergeMap(() => webmateSession.device.getDeviceIdsForProject(MY_WEBMATE_PROJECTID)),
        map( devices => {
            if (devices.length == n) return devices; else throw new Error(`After timeout there weren't ${n} devices`);
        }),
        // Retry at most 6 times with a delay of 10s
        retryWhen(errors => concat(errors.pipe(delay(timeout), take(retries)), throwError(errors))));


    before(function () {
        // The user data can be configured in credentials.ts
        webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL);
    });

    it('should deploy a device', async() => {
        let numberOfRunningDevices = -1;
        let existingDevices: string[] = [];
        let newDeviceId = "";

        // Get all deployed devices
        await webmateSession.device.getDeviceIdsForProject(MY_WEBMATE_PROJECTID).pipe(
            mergeMap(devices => {
                console.log(`Found ${devices.length} running devices`);
                numberOfRunningDevices = devices.length;
                existingDevices = devices;
                // Get all templates
                return webmateSession.device.getDeviceTemplatesForProject(MY_WEBMATE_PROJECTID);
            }),
            mergeMap(templates => {
                console.log(`Found ${templates.length} templates`);
                // Select a win-10 template
                let winTemplate = templates.find(t => t.name.indexOf("win-10") != -1);
                if (!winTemplate) {
                    return throwError(new Error("Didnt find a win 10 template"));
                }
                // Deploy the selected template
                console.log(`Will deploy template: ${winTemplate.name}`);
                return webmateSession.device.requestDeviceByTemplate(MY_WEBMATE_PROJECTID, winTemplate.id);
            }),
            mergeMap(() => {
                // Wait for the device to be deployed
                return waitForNumberOfDevices(numberOfRunningDevices + 1);
            }),
            mergeMap(devices => {
                // Get the id of the new  device
                newDeviceId = devices.filter(d => existingDevices.indexOf(d) == -1)[0];
                console.log("Successfully deployed device with id", newDeviceId);
                // Delete the new device again
                console.log("Deleting device...");
                return webmateSession.device.releaseDevice(newDeviceId);
            }),
            mergeMap(() => {
                // wait for the device to be deleted
                return waitForNumberOfDevices(numberOfRunningDevices);
            }),
            tap(() => console.log("Successfully deleted device"))

        ).toPromise().catch(e => console.error('Got an error:', e.message));
    });
});
