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
    copyNewUsernameToClipboard() {
      const signupInput = document.querySelector('#signupUsernameInput') as HTMLInputElement
      // eslint-disable-next-line functional/no-conditional-statement
      if (/ipad|ipod|iphone/iu.exec(navigator.userAgent)) {
        signupInput.contentEditable = 'true'
        signupInput.readOnly = true

        const range = document.createRange()

        range.selectNodeContents(signupInput)

        const selection = window.getSelection()

        selection?.removeAllRanges()
        selection?.addRange(range)
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        signupInput.setSelectionRange(0, 999999)
      } else {
        signupInput.select()
      }

      document.execCommand('copy')
    },
  },
})

const app = Vue.createApp(LoginPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
