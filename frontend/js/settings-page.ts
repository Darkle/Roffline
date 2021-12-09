import * as R from 'ramda'
import * as Vue from 'vue'
import { ref } from 'vue'

import type { SettingsPageWindowWithProps } from './frontend-global-types'
import { Fetcher, ignoreScriptTagCompilationWarnings, $, wait } from './frontend-utils'

declare const window: SettingsPageWindowWithProps

const successfullyBulkImportedSubs = ref(false)
const errorBulkImportingSubs = ref(false)
const disableBulkImport = ref(false)

// For when importing from https://www.reddit.com/subreddits/mine
const formatSubsFromRedditLink = (str: string): string =>
  str.replace('https://www.reddit.com/r/', '').replaceAll('+', ' ')

const removeMultipleSpacesAndLines = (str: string): string => str.replaceAll(/\s\s+/gu, ' ').replaceAll('\n', ' ')

const parseSubs = R.compose(R.split(' '), removeMultipleSpacesAndLines, formatSubsFromRedditLink, R.trim)

function prependNewSubsToSubMenuInPageHeader(existingSubreddits: string[], newSubs: string[]): void {
  const existingSubs = existingSubreddits.map(subreddit => subreddit.toLowerCase())
  const lowercaseNewSubs = newSubs.map(subreddit => subreddit.toLowerCase())
  const newUniqueSubs = R.without(existingSubs, lowercaseNewSubs)
  const menuSpacerElement = $('.subs-dropdown .menu-spacer') as HTMLHRElement

  newUniqueSubs.forEach(sub => {
    menuSpacerElement.insertAdjacentHTML('afterend', `<p><a href="/sub/${sub}"><span>${sub}</span></a></p>`)
  })
}

const resetTextarea = (bulkImportTextArea: HTMLTextAreaElement): void => {
  // eslint-disable-next-line no-param-reassign
  bulkImportTextArea.value = ''
}

const toggleSuccessImportMessage = (): void => {
  successfullyBulkImportedSubs.value = !successfullyBulkImportedSubs.value
}

const threeSeconds = 3000

function showSuccessfulImportNotice(bulkImportTextArea: HTMLTextAreaElement): Promise<void> {
  return Promise.resolve()
    .then(toggleSuccessImportMessage)
    .then(() => wait(threeSeconds))
    .then(() => {
      toggleSuccessImportMessage()
      resetTextarea(bulkImportTextArea)
    })
}

function showImportErrorNotice(error: Error, bulkSubImportErrorMessageElem: HTMLSpanElement): void {
  errorBulkImportingSubs.value = true
  bulkSubImportErrorMessageElem.textContent = `Error importing subs: ${error.toString()}` // eslint-disable-line no-param-reassign
}

function resetImportMessageState(): void {
  successfullyBulkImportedSubs.value = false
  errorBulkImportingSubs.value = false
}

function toggleDisableBulkImport(): void {
  disableBulkImport.value = !disableBulkImport.value
}

const SettingsPage = Vue.defineComponent({
  data() {
    return {
      userName: window.userSettings.name,
      subreddits: window.userSettings.subreddits,
      hideStickiedPosts: window.userSettings.hideStickiedPosts,
      onlyShowTitlesInFeed: window.userSettings.onlyShowTitlesInFeed,
      infiniteScroll: window.userSettings.infiniteScroll,
      darkModeTheme: window.userSettings.darkModeTheme,
      successfullyBulkImportedSubs,
      errorBulkImportingSubs,
      disableBulkImport,
    }
  },
  methods: {
    updateSetting(event: Event) {
      const inputElement = event.target as HTMLInputElement
      const { settingName } = inputElement.dataset

      const data = { settingName, settingValue: inputElement.checked }

      Fetcher.putJSON('/api/update-user-setting', data).catch(err => console.error(err))
    },
    updateDarkTheme(event: Event) {
      this.updateSetting(event)
      const inputElement = event.target as HTMLInputElement
      const body = document.querySelector('body') as HTMLBodyElement

      inputElement.checked ? body.classList.add('dark-theme') : body.classList.remove('dark-theme')
    },
    importSubs() {
      resetImportMessageState()
      toggleDisableBulkImport()

      const bulkImportTextArea = this.$refs['bulkImporterTextArea'] as HTMLTextAreaElement
      const bulkSubImportErrorMessageElem = this.$refs['bulkSubImportErrorMessage'] as HTMLSpanElement
      const subsToImport = parseSubs(bulkImportTextArea.value)
      const existingSubreddits = this.subreddits

      Fetcher.postJSON('/api/bulk-import-user-subs', { subsToImport })
        .then(() => prependNewSubsToSubMenuInPageHeader(existingSubreddits, subsToImport))
        .then(() => showSuccessfulImportNotice(bulkImportTextArea))
        .catch(err => {
          console.error(err)
          showImportErrorNotice(err, bulkSubImportErrorMessageElem)
        })
        .finally(toggleDisableBulkImport)
    },
  },
})

const app = Vue.createApp(SettingsPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
