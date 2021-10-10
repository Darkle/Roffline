import Vue from 'vue'

const Counter = {
  data(): { counter: number } {
    return {
      counter: 0,
    }
  },
}

Vue.createApp(Counter).mount('#counter')

// function copyNewUsernameToClipboard(): void {
//   ;(this as Alpine).$refs.signupUsernameInput.select()
//   document.execCommand('copy')
// }

// // // eslint-disable-next-line functional/prefer-type-literal
// // interface WindowWithLoginPageType extends Window {
// //   loginPage: () => LoginPageReturnType
// // }

// type LoginPageReturnType = {
//   userIsLoggingIn: boolean
//   copyNewUsernameToClipboard: () => void
// }

// window.loginPage = (): LoginPageReturnType => ({
//   userIsLoggingIn: true,
//   copyNewUsernameToClipboard,
// })

// export { LoginPageReturnType }
