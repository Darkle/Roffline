import { commentsDownloadsLogger } from '../../logging/logging'
import { percentage } from '../../server/utils'

/*****
  We dont want to be too spammy with the logging here.
*****/
// eslint-disable-next-line complexity
function logGetCommentsProgress(itemNumber: number, total: number): void {
  const percentageProgressToLogOn = 10
  const moduloAmount = Math.round(total / percentageProgressToLogOn)
  const isNext10PercentDone = itemNumber % moduloAmount === 0
  const isLastItem = itemNumber === total
  // eslint-disable-next-line functional/no-let
  let percentageDone = percentage(itemNumber, total)
  // eslint-disable-next-line functional/no-conditional-statement, @typescript-eslint/no-magic-numbers
  if (percentageDone === 100 && !isLastItem) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    percentageDone = 99
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (itemNumber === 1 || isNext10PercentDone || isLastItem) {
    commentsDownloadsLogger.debug(`Getting posts comments - ${percentageDone}% complete.`)
  }
}

export { logGetCommentsProgress }
