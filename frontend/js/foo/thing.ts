import * as Vue from 'vue'

const Counter = {
  data(): { counter: number } {
    return {
      counter: 0,
    }
  },
  mounted(): void {
    setInterval(() => {
      // @ts-expect-error asdasd
      this.counter++ // eslint-disable-line functional/immutable-data,no-plusplus
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 1000)
  },
}

Vue.createApp(Counter).mount('#counter')
console.log('asssd')
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
