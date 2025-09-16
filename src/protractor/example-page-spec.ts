import {browser, element, by, By, $, $$, ExpectedConditions} from 'protractor';
import {TestRunEvaluationStatus, WebmateAPISession} from "webmate-sdk-js";
import {WebmateSeleniumSession} from "webmate-sdk-js";
import * as Webmate from "webmate-sdk-js";
import {MY_WEBMATE_APIKEY, MY_WEBMATE_PROJECTID, WEBMATE_API_URL} from "../credentials";

describe('Protractor Demo Test Suite', () => {

    let webmateSession: WebmateAPISession;
    let seleniumSession: WebmateSeleniumSession;

    beforeAll(() => {
        // The targeted web page is not an angular web app, therefore set to false
        browser.waitForAngularEnabled(false);

        // The user data can be configured in credentials.ts
        webmateSession = Webmate.startSession(MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);
    });

    beforeEach(async() => {
        let session = await browser.getSession();
        seleniumSession = webmateSession.addSeleniumSession(session.getId());
    })

    it('should execute a simple protractor test', async() => {
        try {
            let urlExamplePageFuture: string = "http://www.examplepage.org/version/future";
            console.log("Navigating to ", urlExamplePageFuture);
            browser.get(urlExamplePageFuture);

            await webmateSession.browserSession.createState("initial state").toPromise();

            console.log("Clicking on something that will redirect us...");
            element(by.id('goto-examplepage')).click();
            expect(await browser.getTitle()).toEqual("Cross Browser Issues Example");

            let urlExamplePageFormInteraction = "http://www.examplepage.org/form_interaction";
            console.log("Navigate to ", urlExamplePageFormInteraction);
            browser.get(urlExamplePageFormInteraction);

            console.log("Click on link");
            element(by.id('lk')).click();
            let successBox = element(by.className('success'));
            await successBox.click();
            expect(await successBox.getText()).toEqual("Link Clicked!");

            await webmateSession.browserSession.createState("after link").toPromise();

            await webmateSession.browserSession.startAction("Click on button").toPromise();
            console.log("Clicking button");
            element(by.id('bn')).click();
            await webmateSession.browserSession.finishAction().toPromise();

            await webmateSession.browserSession.startAction("Click on checkbox").toPromise();
            console.log("Clicking on checkbox");
            element(by.id('ck')).click();
            await webmateSession.browserSession.finishAction().toPromise();

            await webmateSession.browserSession.startAction("Click on radio button").toPromise();
            console.log("Clicking radio button");
            element(by.id('rd')).click();

            await webmateSession.browserSession.createState("after radio button").toPromise();
            await webmateSession.browserSession.finishAction("was successful").toPromise();

            console.log("Clicking on element with hover event");
            element(by.id('mover')).click();

            console.log("Entering some text...");

            element(by.id('text-input')).click();
            element(by.id('text-input')).sendKeys('Test test');

            console.log("Entering some more text...");
            element(by.id('area')).click();
            element(by.id('area')).sendKeys('Here some more test');

            await seleniumSession.finishTestRun(TestRunEvaluationStatus.PASSED, "TestRun completed successfully").toPromise();
            console.log("Selenium expedition completed");
        } catch (err) {
            await seleniumSession.finishTestRun(TestRunEvaluationStatus.FAILED, "TestRun has failed").toPromise();
            // Rethrow the error
            throw err;
        }

    });

});
