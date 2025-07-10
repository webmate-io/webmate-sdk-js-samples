import {Config} from 'protractor';
import {MY_WEBMATE_APIKEY, MY_WEBMATE_PROJECTID, WEBMATE_SELENIUM_ADDRESS} from "../credentials";

export let config: Config = {
    framework: 'jasmine',
    seleniumAddress: WEBMATE_SELENIUM_ADDRESS,
    specs: [
        './**/*spec.js'
    ],
    capabilities: {
        'wm:apikey': MY_WEBMATE_APIKEY,
        'wm:project': MY_WEBMATE_PROJECTID,
        'browserName': 'CHROME',
        'version': '83',
        'platform': 'WINDOWS_10_64',
    },
}
