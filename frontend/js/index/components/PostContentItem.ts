import * as Vue from 'vue'

const PostContentItem = Vue.defineComponent({
  template: /* html */ `<div class="post-content"></div>`,
  // template: /* html */ `<div class="post-content" v-html="post.postContent"></div>`,
})

export { PostContentItem }
