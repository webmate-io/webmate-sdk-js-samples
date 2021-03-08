import BrowserObject = WebdriverIO.BrowserObject;

export abstract class PageObject {
    protected constructor(protected readonly browserObj: BrowserObject) {}
}
