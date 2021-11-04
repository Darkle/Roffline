import { wait, $ } from './frontend-utils'
/*****
  If there is a hash in the url, then we are trying to link to an anchor in the page, &
    since we have a fixed position header, the anchor will be hidden by the header,
    so we need to account for that.
*****/
// eslint-disable-next-line functional/no-conditional-statement
if (window.location.hash.length > 0) {
  const header = $('header')
  const headerHeight = header ? header.getBoundingClientRect().height : 0
  const delayInMs = 100

  // It takes a tick for the browser to scroll to the element id in the url hash, so wait for that to finish.
  wait(delayInMs).then(_ => {
    $('#bulk-import-reddit-subs')?.scrollIntoView()
    window.scrollTo(0, window.scrollY - headerHeight)
  })
}
