import { DateTime } from 'luxon'

type DateDiff = {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

/*****
  created_utc is a unix timestamp, which is in seconds, not milliseconds.
  We need to use { zone: 'Etc/UTC' } as that is where created_utc is set.
*****/
/* eslint-disable functional/no-conditional-statement,max-lines-per-function,complexity */
function genPrettyDateCreatedAgoFromUTC(unixTimestamp: number): string {
  const postCreatedTime = DateTime.fromSeconds(unixTimestamp, { zone: 'Etc/UTC' })
  const now = DateTime.fromJSDate(new Date())
  const dateDiff = now
    .diff(postCreatedTime, ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])
    .toObject() as DateDiff

  if (dateDiff.years > 0) {
    return `${dateDiff.years} year${dateDiff.years > 1 ? 's' : ''} ago`
  }

  if (dateDiff.months > 0) {
    return `${dateDiff.months} month${dateDiff.months > 1 ? 's' : ''} ago`
  }

  /*****
    If the time is at least one week, but less than two weeks, its nicer to just show that in days.
  *****/
  if (dateDiff.weeks === 1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const days = dateDiff.days + 7
    return `${days} days ago`
  }

  if (dateDiff.weeks > 1) {
    return `${dateDiff.weeks} week${dateDiff.weeks > 1 ? 's' : ''} ago`
  }

  if (dateDiff.days > 0) {
    return `${dateDiff.days} day${dateDiff.days > 1 ? 's' : ''} ago`
  }

  if (dateDiff.hours > 0) {
    return `${dateDiff.hours} hour${dateDiff.hours > 1 ? 's' : ''} ago`
  }

  if (dateDiff.minutes > 0) {
    return `${dateDiff.minutes} minute${dateDiff.minutes > 1 ? 's' : ''} ago`
  }

  if (dateDiff.seconds > 0) {
    return `${dateDiff.seconds} second${dateDiff.seconds > 1 ? 's' : ''} ago`
  }

  return ''
}

/* eslint-enable functional/no-conditional-statement,max-lines-per-function,complexity */

export { genPrettyDateCreatedAgoFromUTC }
