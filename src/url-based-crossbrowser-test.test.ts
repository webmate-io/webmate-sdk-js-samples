import 'mocha';
import {should} from 'chai';
import logger from '@wdio/logger';
import {
    Browser, BrowserType,
    ExpeditionComparisonCheckBuilder, ExpeditionSpecFactory, Platform, PlatformType,
    WebmateAPISession,
} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    MY_WEBMATE_USER, WEBMATE_API_URL
} from "./credentials";
import * as Webmate from "webmate-sdk-js";
import {mergeMap, tap} from "rxjs/operators";
should();

describe('URL Based Crossbrowser Test', function () {

    let log = logger('tests:url-based-crossbrowser-test');

    let webmateSession: WebmateAPISession;

    // time out for test execution
    this.timeout(600000);

    before(function () {
        // The user data can be configured in credentials.ts
        webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    it('should execute a crossbrowser test', async() => {
        // Specify the reference browser
        let referenceBrowser = new Browser(BrowserType.FIREFOX, "91", new Platform(PlatformType.WINDOWS, "10", "64"));

        // Specify the browsers that should be compared to the reference browser
        let crossBrowsers = [
            new Browser(BrowserType.CHROME, "96", new Platform(PlatformType.WINDOWS, "10", "64")),
            new Browser(BrowserType.INTERNET_EXPLORER, "11", new Platform(PlatformType.WINDOWS, "10", "64"))
        ];

        // TODO: do something with results

        // Specify the urls under test
        let urls = [
            "http://www.examplepage.org/version/future",
            "http://www.examplepage.org"
        ];

        let testExecutionSpecBuilder = ExpeditionComparisonCheckBuilder.builder(
            "CrossBrowser Test via SDK",
            ExpeditionSpecFactory.makeUrlListExpeditionSpec(urls, referenceBrowser),
            [...(crossBrowsers.map(browser => ExpeditionSpecFactory.makeUrlListExpeditionSpec(urls, browser)))]
        ).withTagName("SDK").withTagName("Release", "2020-11");

        await webmateSession.testMgmt.startExecutionWithBuilder(testExecutionSpecBuilder).pipe(
            mergeMap(testRun => {
                return testRun.waitForCompletion();
            }),
            tap(info => {
                log.info(`Finished waiting for TestRun: ${info.toString()}`);
                let webmateUrl = WEBMATE_API_URL.substring(0,WEBMATE_API_URL.length-6);
                log.info(`The result is available at: ${webmateUrl}#/projects/${info.projectId}/testlab/testruns/${info.testRunId}`);
            })
        ).toPromise();
    });

});
