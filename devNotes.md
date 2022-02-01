# Dev Notes:

- We output to commonjs on the backend cause too many npm libraries for the backend have absolutely no esm support (requires instead of imports), so gotta output to commonjs, but we are coding in esm
- We are using [lmdb](https://github.com/DoctorEvidence/lmdb-js) for the comments
- You can run individual tasks in TaskFile.ts like this: `npx task tests:npmaudit`
- When testing, you may need to run `sudo npx playwright install-deps` to install the playwright deps. https://playwright.dev/docs/cli#install-system-dependencies
- You can set the db sql calls to be logged to terminal by either changing the logging level or setting the
  `EXCESSIVE_DB_LOGGING` env variable to be true
- In testing/debugging, there is a `ROFFLINE_NO_UPDATE` env variable you can set to true to disable updating.
- If you changed anything in the html (or js that changes the html), a test that snapshots the html will prolly fail. In that case, just delete the corresponding snapshot for the test and run it again. It will fail again but say it has written a new snapshot file. Then run it again and it should pass.
- The Roffline icon is this one https://www.iconfinder.com/icons/5991347/animal_bacteria_dog_virus_icon
