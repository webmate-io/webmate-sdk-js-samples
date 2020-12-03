# webmate TypeScript and JavaScript SDK Samples

This repository contains examples of how to use the [webmate SDK](https://github.com/webmate-io/webmate-sdk-js).
See the REST API [Swagger documentation](https://app.webmate.io/api/swagger) for a comprehensive summary of the webmate functionalities.

## Executing the Tests
This project demonstrates how to interact with the webmate API using the official webmate SDK for TypeScript and JavaScript.

Before running the tests, enter your webmate credentials in `credentials.ts`.

It contains two different tests. The test located in `device.test.ts` demonstrates the lifecycle of a device. 
The test in `selenium-test.test.ts` creates two browser sessions by executing the same selenium test using two different browsers. 
It then demonstrates how to use the browser sessions to start a cross browser test and query the resulting artifacts and results.   
   
To build the TypeScript tests located is `src/` run `npm run build`. This will create the according `.js` tests in the `test/` directory.

To run them execute `npm run test`. Please note that running the tests will also build them automatically.
It is also possible to run the tests separately, using the commands `npm run device-test` and `npm run cb-test` respectively. 

