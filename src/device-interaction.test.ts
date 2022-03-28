import 'mocha';
import {should} from 'chai';
import logger from '@wdio/logger';
import * as Webmate from "webmate-sdk-js";
import {DeviceDTO, DeviceRequest, ImageType, Package, Platform, PlatformType, WebmateAPISession,} from "webmate-sdk-js";
import {MY_WEBMATE_APIKEY, MY_WEBMATE_PROJECTID, MY_WEBMATE_USER, WEBMATE_API_URL} from "./credentials";
import path from "path";
import {delay, map, mergeMap, retryWhen, take, tap} from "rxjs/operators";
import {concat, of, throwError} from "rxjs";

should();

/**
 * The device interaction test shows basic and advanced management of devices, such as deploying, releasing,
 * uploading apps, uploading images and configuring camera simulation.
 *
 * Note that the tests consequently releasing devices after requesting them to enable successive execution of the tests.
 * Otherwise at some point there were no more available devices to deploy.
 */
describe('Device Interaction Test', function () {

    let log = logger('tests:device-interaction');

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
        webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    it('should deploy an Android device and release it afterwards', async() => {
        log.info('Deploy an Android device')
        let platform = new Platform(PlatformType.ANDROID, "11");
        let deviceRequest = new DeviceRequest("Sample Device", new Map([['machine.platform', platform.toString()]]));
        await webmateSession.device.requestDeviceByRequirements(MY_WEBMATE_PROJECTID, deviceRequest).pipe(
            tap(device => {
                log.info(`Deployed an Android device with id: ${device.id}`)
            }),
            delay(3000),
            mergeMap(device => {
                return webmateSession.device.releaseDevice(device.id);
            }),
            tap(() => {
                log.info(`Deleted Android device`)
            })
        )
    });

    it('should test deploying a Windows 10 machine and delete it afterwards', async() => {
        let baseNumberDevices = -1;
        let existingDevices: string[] = [];
        let newDeviceId = "";

        // Get all deployed devices
        await webmateSession.device.getDeviceIdsForProject(MY_WEBMATE_PROJECTID).pipe(
            mergeMap(devices => {
                log.info(`Found existing devices ${devices}`);
                baseNumberDevices = devices.length;
                existingDevices = devices;

                // Request a Windows 10 device
                let windows10Request = "Win10 Request";
                let platform = new Platform(PlatformType.WINDOWS, "10", "64");
                let deviceRequirements = new Map([['machine.platform', platform.toString()]]);
                let deviceRequest = new DeviceRequest(windows10Request, deviceRequirements);
                return webmateSession.device.requestDeviceByRequirements(MY_WEBMATE_PROJECTID, deviceRequest);
            }),
            mergeMap(() => {
                // Check if device has been deployed
                return waitForNumberOfDevices(baseNumberDevices + 1);
            }),
            mergeMap(newDevices => {
                // Find id of new device
                newDeviceId = newDevices.filter(d => existingDevices.indexOf(d) == -1)[0];
                log.info("Successfully deployed device with id: " + newDeviceId);
                // Delete the new device again
                log.info("Going to delete device " + newDeviceId);
                return webmateSession.device.releaseDevice(newDeviceId);
            }),
            mergeMap(() => {
                // Check if device has been deleted
                return waitForNumberOfDevices(baseNumberDevices);
            }),
            tap(() => log.info("Successfully deleted device"))

        ).toPromise().catch(e => console.error('Got an error:', e.message));
    });

    it('upload and install an APK into webmate on a deployed Android device', async() => {
        let apkFilePath = path.resolve('./src/res/sample.apk');
        await webmateSession.packages.uploadPackage(MY_WEBMATE_PROJECTID, apkFilePath, "Example app", "apk").pipe(
            delay(2000),
            tap((pkgInfo: Package) => {
                log.info(`App ${pkgInfo.id} has been uploaded`);
            }),
            mergeMap((pkgInfo: Package) => {
                let platform = new Platform(PlatformType.ANDROID, "11");
                let deviceRequirements = new Map([['machine.platform', platform.toString()]]);
                let deviceRequest = new DeviceRequest("Test Device", deviceRequirements);
                return webmateSession.device.requestDeviceByRequirements(MY_WEBMATE_PROJECTID, deviceRequest).pipe(
                    map(newDevice => {
                        return {newDevice: newDevice, pkgInfo: pkgInfo}
                    })
                );
            }),
            tap(({newDevice, pkgInfo}) => {
                log.info(`Device ${newDevice.id} has been deployed`);
            }),
            delay(2000),
            mergeMap(({newDevice, pkgInfo}) => {
               return webmateSession.device.installAppOnDevice(newDevice.id, pkgInfo.id).pipe(
                   map(() => {
                       return newDevice
                   })
               );
            }),
            mergeMap((newDevice) => {
                return webmateSession.device.releaseDevice(newDevice.id);
            }),
            tap(() => {
                log.info(`App has been installed on device`);
            })
        ).toPromise();
    });

    it('should upload an image and use it for camera simulation', async() => {
        // Deploy new device with Platform Android 11
        let platform = new Platform(PlatformType.ANDROID, "11");
        let deviceRequirements = new Map([['machine.platform', platform.toString()]]);
        let deviceRequest = new DeviceRequest("Test Device", deviceRequirements);
        await webmateSession.device.requestDeviceByRequirements(MY_WEBMATE_PROJECTID, deviceRequest).pipe(
            mergeMap((newDevice: DeviceDTO) => {
                let imageFilePath = path.resolve('./src/res/qrcode.png');
                return webmateSession.device.uploadImageToDeviceAndSetForCameraSimulationWithFilePath(MY_WEBMATE_PROJECTID,
                    imageFilePath, "MyQRCode", ImageType.PNG, newDevice.id).pipe(
                        map(imageId => {
                            return {newDevice, imageId}
                        })
                );
            }),
            tap(({newDevice, imageId}) => {
                log.info(`Image ${imageId} was uploaded to device ${newDevice.id} and selected for the camera simulation`);
            }),
            mergeMap(({newDevice, imageId}) => {
                return webmateSession.device.releaseDevice(newDevice.id);
            })
        ).toPromise();
    });

});
