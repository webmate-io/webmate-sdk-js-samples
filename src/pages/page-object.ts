import BrowserObject = WebdriverIO.BrowserObject;

// docs:start base
export abstract class PageObject {
    protected constructor(protected readonly browserObj: BrowserObject) {}
}
// docs:end base
