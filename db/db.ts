import fs from 'node:fs'

import { createConnection, getConnection, UpdateResult } from 'typeorm'
import * as R from 'ramda'
import { Maybe, get as MaybeGet, nullable as MaybeNullable, Nothing, Just } from 'pratica'

import { UpdatesTracker } from './entities/UpdatesTracker'
import { SubredditsMasterList } from './entities/SubredditsMasterList'
import { User } from './entities/Users'
import { Entities } from './entities/index'
import { firstRun } from './db-first-run'
import { noop } from '../server/utils'

const threeSecondsInMS = 3000
const dbPath = process.env['DBPATH'] || './roffline-storage.db'
const dbFileDoesNotExist = !fs.statSync(dbPath, { throwIfNoEntry: false })

const db = {
  init(): Promise<void> {
    return createConnection({
      type: 'sqlite',
      database: dbPath,
      entities: [...Entities],
      logging: false, //If set to true then query and error logging will be enabled.
      maxQueryExecutionTime: threeSecondsInMS,
      synchronize: dbFileDoesNotExist,
    }).then(firstRun)
  },
  close(): Promise<void> {
    return getConnection().close()
  },
  getLastScheduledUpdateTime(): Promise<Maybe<string>> {
    return UpdatesTracker.findOne(1, { select: ['lastUpdateDateAsString'] }).then(
      MaybeGet(['lastUpdateDateAsString'])
    )
  },
  setLastScheduledUpdateTime(date: string | Date): Promise<UpdateResult> {
    const dateAsString = typeof date === 'string' ? date : date.toString()

    return UpdatesTracker.update(1, { lastUpdateDateAsString: dateAsString })
  },
  getUserSettings(userName: string): Promise<User | Maybe<User>> {
    return User.findOne({ name: userName }).then(MaybeNullable)
  },
  getUserSpecificSetting(userName: string, settingName: string): Promise<Maybe<string | string[] | boolean>> {
    return User.findOne({ name: userName }).then(MaybeGet([settingName]))
  },
  setUserSpecificSetting(
    userName: string,
    settingName: string,
    settingValue: string | boolean | string[]
  ): Promise<void | UpdateResult> {
    const isSubredditSetting = settingName === 'subreddits'
    const isSingleSubredditUpdate = isSubredditSetting && !Array.isArray(settingValue)

    return isSingleSubredditUpdate
      ? db.addUserSubredditSingle(userName, settingValue as string)
      : isSubredditSetting
      ? db.addUserSubreddits(userName, settingValue as string[])
      : User.update({ name: userName }, { [settingName]: [settingValue] })
    // return User.update({ name: userName }, { [settingName]: [settingValue] })
  },
  addUserSubreddits(username: string, subreddits: string[]): Promise<void | UpdateResult> {
    const subs = R.map(R.toLower, subreddits)

    return db
      .getUserSpecificSetting(username, 'subreddits')
      .then((maybeUserSubs): UpdateResult | void | Promise<UpdateResult> =>
        maybeUserSubs.cata({
          Just: userSubs =>
            User.update({ name: username }, { subreddits: R.uniq([...(userSubs as string[]), ...subs]) }),
          Nothing: noop,
        })
      )
  },
  addUserSubredditSingle(username: string, subreddit: string): Promise<void | UpdateResult> {
    return db.addUserSubreddits(username, [subreddit])
  },
  getAllSubreddits(): Promise<Maybe<string[]>> {
    return SubredditsMasterList.find({ select: ['subreddit'] }).then(results =>
      MaybeNullable(results).map(R.pluck('subreddit'))
    )
  },
  batchAddSubredditsToMasterList(subreddits: string[]): Promise<void | UpdateResult> {
    const subs = subreddits.map(sub => ({ subreddit: sub.toLocaleLowerCase() }))

    return getConnection()
      .createQueryBuilder()
      .insert()
      .into(SubredditsMasterList)
      .values(subs)
      .orIgnore()
      .execute()
  },
}

export { db }

setTimeout(() => {
  // User.save(User.create({ name: 'foo' }))
  //   .then(res => {
  //     console.log(res)
  //   })
  //   .then(() =>
  db.getAllSubreddits()
    .then(res => {
      // console.log(res)
      res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
      return db.batchAddSubredditsToMasterList(['derp', 'welp'])
    })
    .then(_ => db.getAllSubreddits())
    // .then(res => console.dir(JSON.stringify(res)))
    .then(res => res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') }))
  // )
  // console.log(Object.keys(User))
}, 2000) // eslint-disable-line @typescript-eslint/no-magic-numbers
// setTimeout(() => {
//   db.getLastScheduledUpdateTime()
//     .then(res => {
//       console.log(res)
//       return db.setLastScheduledUpdateTime(new Date())
//     })
//     .then(() =>
//       db.getLastScheduledUpdateTime().then(res => {
//         console.log(res)
//       })
//     )
// }, 3000) // eslint-disable-line @typescript-eslint/no-magic-numbersrs
