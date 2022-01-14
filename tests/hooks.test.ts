// TODO:
// I need to do all of this before the e2e tests instead of here right? Or should i re-setup it there as well??
// Create user - set it to the one set in the .testing.env file.
// Populate db with posts
// Populate comments db with comments.
// So would need some posts to have more than one image, and i would need to set those posts to be an image post
//    so i guess we also need post data of the 5 (or more) different post types.
// So will also need some posts to have empty comments, some to have some comments, and some to have null for comments so we can say still getting comments.
// Populate testing-posts-media folder with subfolders of each post with media
//  Perhaps instead of copying the data from seed (eg images/videos), i could just do symlinks

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
