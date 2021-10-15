import * as Vue from 'vue'

const LoginPage = Vue.defineComponent({
  data() {
    return {
      userIsLoggingIn: true,
    }
  },
  mounted() {
    const signupForm = this.$refs['signupform'] as HTMLFormElement
    signupForm.removeAttribute('x-cloak')
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

Vue.createApp(LoginPage).mount('body')
