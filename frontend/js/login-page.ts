import * as Vue from 'vue'

const Counter = Vue.defineComponent({
  data() {
    return {
      userIsLoggingIn: true,
    }
  },
  mounted() {
    document.querySelector('.signup-form')?.removeAttribute('x-cloak')
  },
  methods: {
    setUserIsLoggingIn(val: boolean) {
      this.userIsLoggingIn = val
    },
    copyNewUsernameToClipboard() {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(document.querySelector('#signupUsernameInput') as HTMLInputElement)?.select()
      document.execCommand('copy')
    },
  },
})

Vue.createApp(Counter).mount('body')
