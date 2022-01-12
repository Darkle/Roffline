import * as Vue from 'vue'

import { Fetcher, $, wait } from './frontend-utils'
import type { SubManagementPagePageWindowWithProps } from './frontend-global-types'

declare const window: SubManagementPagePageWindowWithProps

function addSubToSubMenuInPageHeader(sub: string): void {
  const menuSpacerElement = $('.subs-dropdown .menu-spacer') as HTMLHRElement

  menuSpacerElement.insertAdjacentHTML(
    'afterend',
    `<p data-menu-subreddit="${sub}"><a href="/sub/${sub}"><span>${sub}</span></a></p>`
  )
}

function removeSubFromSubMenuInPageHeader(sub: string): void {
  const menuSub = $(`p[data-menu-subreddit="${sub}"]`) as HTMLParagraphElement

  menuSub.remove()
}

const threeSeconds = 3000

const state = Vue.reactive({
  // eslint-disable-next-line functional/immutable-data
  userSubreddits: [...window.userSettings.subreddits.sort()],
  subredditThatWasAddedOrRemoved: '',
  subredditWasAdded: false,
  subredditWasRemoved: false,
})

const PostPage = Vue.defineComponent({
  data() {
    return state
  },
  methods: {
    // eslint-disable-next-line max-lines-per-function
    addSubreddit({ target }: { target: HTMLFormElement }): void {
      const formData = new FormData(target)
      // split(' ')[0] is in case they accidentally add more than one sub
      const subToAdd = (formData.get('subToAdd') as string).trim().split(' ')[0] as string
      const existingUserSubs = this.userSubreddits.map(subreddit => subreddit.toLowerCase())
      const addSubInputElem = this.$refs['addSubredditInput'] as HTMLInputElement

      // eslint-disable-next-line functional/no-conditional-statement
      if (existingUserSubs.includes(subToAdd.toLowerCase())) {
        // eslint-disable-next-line functional/immutable-data
        addSubInputElem.value = ''
        return
      }

      Fetcher.postJSON('/api/add-user-subreddit', { subToAdd })
        .then(() => {
          addSubToSubMenuInPageHeader(subToAdd)

          // eslint-disable-next-line functional/immutable-data
          this.userSubreddits.unshift(subToAdd)

          this.subredditThatWasAddedOrRemoved = subToAdd
          this.subredditWasAdded = true

          // eslint-disable-next-line functional/immutable-data
          addSubInputElem.value = ''

          wait(threeSeconds).then(() => {
            this.subredditWasAdded = false
          })
        })
        .catch(err => console.error(err))
    },
    removeSubreddit(event: Event): void {
      const clickedDiv = event.currentTarget as HTMLDivElement
      const subDiv = clickedDiv.firstElementChild as HTMLDivElement

      const subToRemove = subDiv.dataset['subToRemove']?.trim().toLowerCase() as string
      const removeSubConfirmation = confirm(`Remove ${subToRemove} subreddit?`) // eslint-disable-line no-alert

      // eslint-disable-next-line functional/no-conditional-statement
      if (!removeSubConfirmation) return

      Fetcher.postJSON('/api/remove-user-subreddit', { subToRemove })
        .then(() => {
          removeSubFromSubMenuInPageHeader(subToRemove)

          // eslint-disable-next-line functional/immutable-data
          this.userSubreddits = this.userSubreddits.filter(currentSub => currentSub !== subToRemove)

          this.subredditThatWasAddedOrRemoved = subToRemove
          this.subredditWasRemoved = true

          wait(threeSeconds).then(() => {
            this.subredditWasRemoved = false
          })
        })
        .catch(err => console.error(err))
    },
  },
})

const app = Vue.createApp(PostPage)

app.mount('main')
