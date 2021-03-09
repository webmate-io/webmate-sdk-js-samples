import {After, Before, Given, Then, When} from "@cucumber/cucumber";
import * as Webmate from "webmate-sdk-js";
import {
    Browser,
    BrowserType,
    Platform,
    PlatformType,
    StoryCheckBuilder,
    TestRun,
    TestRunEvaluationStatus,
    WebmateAPISession
} from "webmate-sdk-js";
import {
    MY_WEBMATE_APIKEY,
    MY_WEBMATE_PROJECTID,
    MY_WEBMATE_USER,
    WEBMATE_API_URL,
    WEBMATE_SELENIUM_HOST,
    WEBMATE_SELENIUM_PORT,
    WEBMATE_SELENIUM_PROTOCOL
} from "../credentials";
import {ExamplePageFormInteraction} from "../pages/example-page-form-interaction";
import * as webdriverio from 'webdriverio';
import BrowserObject = WebdriverIO.BrowserObject;
import {should} from "chai";
should();


let webmateSession: WebmateAPISession;
let testRun: TestRun;
let browserObj: BrowserObject;
let examplePageFormInteraction: ExamplePageFormInteraction;

function getOptions(browser: Browser): WebdriverIO.RemoteOptions {
    return {
        capabilities: {
            browserName: browser.browserType,
            version: browser.version,
            platform: browser.platform.toString(),
            // @ts-ignore
            email: MY_WEBMATE_USER,
            apikey: MY_WEBMATE_APIKEY,
            project: MY_WEBMATE_PROJECTID
        },
        hostname: WEBMATE_SELENIUM_HOST,
        protocol: WEBMATE_SELENIUM_PROTOCOL,
        port: WEBMATE_SELENIUM_PORT,
        connectionRetryTimeout: 240000,
        connectionRetryCount: 1,
        logLevel: 'debug'
    };
}

Before({timeout: 60000}, async function() {
    webmateSession = Webmate.startSession(MY_WEBMATE_USER, MY_WEBMATE_APIKEY, WEBMATE_API_URL, MY_WEBMATE_PROJECTID);

    let platform = new Platform(PlatformType.WINDOWS, "10", "64");
    let browser = new Browser(BrowserType.CHROME, "83", platform);
    let options = getOptions(browser);
    browserObj = await webdriverio.remote(options);
    webmateSession.addSeleniumSession(browserObj.sessionId);
    testRun = await webmateSession.testMgmt.startExecutionWithBuilder(
        StoryCheckBuilder.builder("testIfInteractionPageIsTestable")).toPromise();

    examplePageFormInteraction = new ExamplePageFormInteraction(browserObj);
});

Given("the examplepage has been opened", async function() {
    await browserObj.url("http://www.examplepage.org/form_interaction");
});

When("the user clicks on 'link click'", async function() {
    await examplePageFormInteraction.clickLink();
});

Then("{string} text box should be visible", async function(str) {
    let sucText = await examplePageFormInteraction.getSuccessBoxText();
    sucText.should.equal(str, "Success text was wrong");
});

When("she clicks on 'button click'", async function() {
    await examplePageFormInteraction.clickButtonClick();
});

When("she clicks on 'checkbox click'", async function() {
    await examplePageFormInteraction.clickCheckboxClick();
});

When("she enables the radio button", async function() {
    await examplePageFormInteraction.clickRadioButton();
});

When("she activates 'hover me'", async function() {
    await examplePageFormInteraction.clickHoverMe();
});

When("she enters input into the input field", async function() {
    await examplePageFormInteraction.enterTextIntoInput("Test test");
});

When("she enters input into the text area", async function() {
    await examplePageFormInteraction.enterTextIntoTextArea("Some more test");
});

Then("the test was successful", async function() {
    await testRun.finish(TestRunEvaluationStatus.PASSED);
});

After(async function() {
    if (!!browserObj) {
        await browserObj.deleteSession();
    }
})
