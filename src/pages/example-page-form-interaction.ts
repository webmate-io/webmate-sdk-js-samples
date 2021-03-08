import {PageObject} from "./page-object";
import BrowserObject = WebdriverIO.BrowserObject;

export class ExamplePageFormInteraction extends PageObject {

    constructor(browserObj: BrowserObject) {
        super(browserObj);
    }

    async clickLink() {
        let link = await this.browserObj.$("#lk");
        await link.click();
    }

    async getSuccessBoxText() {
        let successBox = await this.browserObj.$(".success");
        await successBox.isExisting();
        return await successBox.getText();
    }

    async clickButtonClick() {
        let bn = await this.browserObj.$("#bn");
        await bn.click();
    }

    async clickCheckboxClick() {
        let ck = await this.browserObj.$("#ck");
        await ck.click();
    }

    async clickRadioButton() {
        let rd = await this.browserObj.$("#rd");
        await rd.click();
    }

    async clickHoverMe() {
        let mover = await this.browserObj.$("#mover");
        await mover.click();
    }

    async enterTextIntoInput(msg: string) {
        let input = await this.browserObj.$("#text-input");
        await input.click();
        await input.setValue(msg);
    }

    async enterTextIntoTextArea(msg: string) {
        let area = await this.browserObj.$("#area");
        await area.click();
        await area.setValue("Here some more test");
    }

}
