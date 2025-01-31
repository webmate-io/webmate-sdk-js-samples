import {Config} from 'protractor';
import {MY_WEBMATE_APIKEY, MY_WEBMATE_PROJECTID, MY_WEBMATE_USER, WEBMATE_SELENIUM_ADDRESS} from "../credentials";

export let config: Config = {
    framework: 'jasmine',
    seleniumAddress: WEBMATE_SELENIUM_ADDRESS,
    specs: [
        './**/*spec.js'
    ],
    capabilities: {
        'email': MY_WEBMATE_USER,
        'apikey': MY_WEBMATE_APIKEY,
        'project': MY_WEBMATE_PROJECTID,
        'browserName': 'CHROME',
        'version': '106',
        'platform': 'WINDOWS_11_64',
    },
}
