import * as Vue from 'vue'

import { ignoreScriptTagCompilationWarnings } from './frontend-utils'

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

const app = Vue.createApp(LoginPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
