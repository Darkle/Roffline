- You can run the tasks in TaskFile.ts like this: `npx task tests:npmaudit`
- When testing, you may need to run `sudo npx playwright install-deps` to install the playwright deps. https://playwright.dev/docs/cli#install-system-dependencies
- You can set the db sql calls to be logged to terminal by either changing the logging level or setting the
  `EXCESSIVE_DB_LOGGING` env variable to be true
- In testing/debugging, there is a `ROFFLINE_NO_UPDATE` env variable you can set to true to disable updating.
- If you changed anything in the html (or js that changes the html), a test that snapshots the html will prolly fail. In that case, just delete the corresponding snapshot for the test and run it again. It will fail again but say it has written a new snapshot file. Then run it again and it should pass.
