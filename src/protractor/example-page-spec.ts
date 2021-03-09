import {browser, element, by, By, $, $$, ExpectedConditions} from 'protractor';

describe('Protractor Demo Test Suite', () => {

    beforeAll(() => {
        browser.waitForAngularEnabled(false);
    });


    it('should execute a simple protractor test', async() => {
        let urlExamplePageFuture: string = "http://www.examplepage.org/version/future";
        browser.get(urlExamplePageFuture);
    });

});
