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
    return `${dateDiff.years.toFixed()} year${dateDiff.years > 1 ? 's' : ''} ago`
  }

  if (dateDiff.months > 0) {
    return `${dateDiff.months.toFixed()} month${dateDiff.months > 1 ? 's' : ''} ago`
  }

  /*****
    If the time is at least one week, but less than two weeks, its nicer to just show that in days.
  *****/
  if (dateDiff.weeks === 1) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const days = dateDiff.days + 7
    return `${days.toFixed()} days ago`
  }

  if (dateDiff.weeks > 1) {
    return `${dateDiff.weeks.toFixed()} week${dateDiff.weeks > 1 ? 's' : ''} ago`
  }

  if (dateDiff.days > 0) {
    return `${dateDiff.days.toFixed()} day${dateDiff.days > 1 ? 's' : ''} ago`
  }

  if (dateDiff.hours > 0) {
    return `${dateDiff.hours.toFixed()} hour${dateDiff.hours > 1 ? 's' : ''} ago`
  }

  if (dateDiff.minutes > 0) {
    return `${dateDiff.minutes.toFixed()} minute${dateDiff.minutes > 1 ? 's' : ''} ago`
  }

  if (dateDiff.seconds > 0) {
    return `${dateDiff.seconds.toFixed()} second${dateDiff.seconds > 1 ? 's' : ''} ago`
  }

  return ''
}

/* eslint-enable functional/no-conditional-statement,max-lines-per-function,complexity */

export { genPrettyDateCreatedAgoFromUTC }
