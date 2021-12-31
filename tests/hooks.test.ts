// TODO:
// Create user
// Populate db with posts
// Populate comments db with comments.
// Populate testing-posts-media folder with subfolders of each post with media

export const mochaHooks = {
  beforeAll(): void {
    const self = this as Mocha.Suite
    self.timeout(60000)
    console.log('beforeAll called')
  },
  afterAll(): void {
    //TODO: make sure to remove the testing comments db and testing posts folder and testing logs.
    console.log('afterAll called')
  },
}
