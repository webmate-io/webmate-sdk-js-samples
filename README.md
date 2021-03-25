# webmate JavaScript and TypeScript SDK Samples <img src="https://avatars.githubusercontent.com/u/13346605" alt="webmate logo" width="28"/>

This repository contains examples of how to use the official [webmate JavaScript and TypeScript SDK](https://github.com/webmate-io/webmate-sdk-js).


## Samples

Before running the tests, enter your webmate credentials in `credentials.ts`.

To build the TypeScript tests located at `src/` run `npm run build`. This will create the according `.js` tests in the `test/` directory.

To run all tests execute `npm run test`.
Please note that running the tests will also build them automatically.
It is also possible to run the tests individually as mentioned in the according description in the table.

<table border="1">
    <tr>
        <th>Test</th>
        <th>Frameworks</th>
        <th>Description</th>
    </tr>
    <tr>
        <td>
            <a href="./src/cucumber/example-page.steps.ts">Cucumber Test</a>
        </td>
        <td>Cucumber, Selenium, JUnit</td>
        <td>
            ...
            Execute `npm run cucumber-test`.
        </td>
    </tr>
    <tr>
        <td>
            <a href="./src/protractor/example-page-spec.ts">Protractor Test</a>
        </td>
        <td>Protractor, Jasmine</td>
        <td>
            ...
            Execute `npm run protractor-test`.
        </td>
    </tr>
    <tr>
        <td>
            <a href="./src/selenium-test.test.ts">Selenium Test</a>
        </td>
        <td>WebdriverIO, Mocha, Chai</td>
        <td>
            The test in `selenium-test.test.ts` creates two browser sessions by executing the same selenium test using two different browsers. 
            It then demonstrates how to use the browser sessions to start a cross browser test and query the resulting artifacts and results.
            Execute `npm run selenium-test`.
        </td>
    </tr>
    <tr>
        <td>
            <a href="./src/device-interaction.test.ts">Device Interaction Test</a>
        </td>
        <td>Mocha, Chai</td>
        <td>
            The test located in `device-interaction.test.ts` demonstrates the lifecycle of a device.
            Execute `npm run device-test`.
        </td>
    </tr>
    <tr>
        <td>
            <a href="./src/url-based-crossbrowser-test.test.ts">URL Based Crossbrowser Test</a>
        </td>
        <td>Mocha, Chai</td>
        <td>
            ...
            Execute `npm run cb-test`.
        </td>
    </tr>
</table>


## webmate API

Although, the SDK provides a number of features and convenience wrappers it doesn't exhaust the full potential of the webmate API.
See the REST API [Swagger documentation](https://app.webmate.io/api/swagger) for a comprehensive summary of the webmate functionalities.
