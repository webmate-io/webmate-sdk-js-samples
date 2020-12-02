# webmate-sdk-js-samples

## Executing the tests
This project demonstrates how to interact with the webmate API using the official webmate SDK for Typescript and JavaScript.

Before running the tests, enter your webmate credentials in `credentials.ts`.

It contains two different tests. The test located in `device.test.ts` demonstrates the lifecycle of a device. 
The test in `selenium-test.test.ts` creates two browser sessions by executing the same selenium test using two different browsers. 
It then demonstrates how to use the browser sessions to start a cross browser test and query the resulting artifacts and results.   
   
To build the typescript tests located is `src/` run `npm run build`. This will create the according `.js` tests in the `test/` directory.

To run them execute `npm run test`. Please note that running the tests will also build them automatically.
It is also possible to run the tests separately, using the commands `npm run device-test` and `npm run cb-test` respectively. 

