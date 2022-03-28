import {ProjectId} from "webmate-sdk-js";

/**
 * These are the credentials with which you can use the SDK with the demo instance of Webmate (https://demo.webmate.io).
 * Simply fill in the username, api key and project ID
 * Details on how to get your API Key and Project ID can be found in the official webmate documentation.
 *         https://docs.webmate.io/reference/generate-api-key/?searchTerm=api
 * There is no need to change the Selenium HOST or the Webmate API URL
 */
export const MY_WEBMATE_USER: string = "xxxx@xxxxxxxxx.com";
export const MY_WEBMATE_APIKEY: string = "xxxxxx-xxxxx-xxxx-ba43-da86b97734eb";
export const MY_WEBMATE_PROJECTID: ProjectId = "xxxxxx-1b49-4eb0-bb3a-xxxxxxxxx";

export const WEBMATE_SELENIUM_PORT: number = 44444;
export const WEBMATE_SELENIUM_HOST: string = "selenium-demo.webmate.io";
export const WEBMATE_SELENIUM_PROTOCOL: string = "https";

export const WEBMATE_API_URL: string = "https://demo.webmate.io/api/v1";
export const WEBMATE_SELENIUM_ADDRESS: string = WEBMATE_SELENIUM_PROTOCOL + "://" + WEBMATE_SELENIUM_HOST + ":" + WEBMATE_SELENIUM_PORT + "/wd/hub";
