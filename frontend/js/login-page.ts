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
      const signupInput = document.querySelector('#signupUsernameInput') as HTMLInputElement

      signupInput?.select()
      document.execCommand('copy')
    },
  },
})

Vue.createApp(Counter).mount('body')
