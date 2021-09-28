// import fs from 'node:fs'

// import * as R from 'ramda'
import { Sequelize } from 'sequelize'
// import { match } from 'ts-pattern'
// import { Maybe, get as MaybeGet, nullable as MaybeNullable } from 'pratica'

// import { UpdatesTracker } from './entities/UpdatesTracker'
// import { SubredditsMasterList } from './entities/SubredditsMasterList'
// import { User } from './entities/Users'
import { firstRun } from './db-first-run'
// import { noop } from '../server/utils'
import { mainLogger } from '../logging/logging'

// const threeSecondsInMS = 3000
const dbPath = process.env['DBPATH'] || './roffline-storage.db'
// const dbFileDoesNotExist = !fs.statSync(dbPath, { throwIfNoEntry: false })

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg): void => mainLogger.trace(msg),
})

const db = {
  sequelize,
  init() {
    return firstRun(sequelize)
  },
  // close(): Promise<void> {
  //   return sequelize.close()
  // },
  // getLastScheduledUpdateTime(): Promise<Maybe<string>> {
  //   return UpdatesTracker.findOne(1, { select: ['lastUpdateDateAsString'] }).then(
  //     MaybeGet(['lastUpdateDateAsString'])
  //   )
  // },
  // setLastScheduledUpdateTime(date: string | Date): Promise<UpdateResult> {
  //   return UpdatesTracker.update(1, { lastUpdateDateAsString: date.toString() })
  // },
  // getUserSettings(userName: string): Promise<User | Maybe<User>> {
  //   return User.findOne({ name: userName }).then(MaybeNullable)
  // },
  // getUserSpecificSetting(userName: string, settingName: string): Promise<Maybe<string | string[] | boolean>> {
  //   return User.findOne({ name: userName }).then(MaybeGet([settingName]))
  // },
  // setUserSpecificSetting(
  //   userName: string,
  //   settingName: string,
  //   settingValue: string | boolean | string[]
  // ): Promise<void | UpdateResult> {
  //   const updateDetails = {
  //     settingName,
  //     settingValIsArray: Array.isArray(settingValue),
  //   }

  //   return match(updateDetails)
  //     .with({ settingName: 'subreddits', settingValIsArray: false }, () =>
  //       db.addUserSubreddit(userName, settingValue as string)
  //     )
  //     .with({ settingName: 'subreddits', settingValIsArray: true }, () =>
  //       db.batchAddUserSubreddits(userName, settingValue as string[])
  //     )
  //     .otherwise(() => User.update({ name: userName }, { [settingName]: [settingValue] }))
  // },
  // batchAddUserSubreddits(username: string, subreddits: string[]): Promise<void | UpdateResult> {
  //   const subs = R.map(R.toLower, subreddits)

  //   return db
  //     .getUserSpecificSetting(username, 'subreddits')
  //     .then((maybeUserSubs): UpdateResult | void | Promise<UpdateResult> =>
  //       maybeUserSubs.cata({
  //         Just: userSubs =>
  //           User.update({ name: username }, { subreddits: R.uniq([...(userSubs as string[]), ...subs]) }),
  //         Nothing: noop,
  //       })
  //     )
  // },
  // addUserSubreddit(username: string, subreddit: string): Promise<void | UpdateResult> {
  //   return db.batchAddUserSubreddits(username, [subreddit])
  // },
  // getAllSubreddits(): Promise<Maybe<string[]>> {
  //   return SubredditsMasterList.find({ select: ['subreddit'] }).then(results =>
  //     MaybeNullable(results).map(R.pluck('subreddit'))
  //   )
  // },
  // batchAddSubredditsToMasterList(subreddits: string[]): Promise<UpdateResult> {
  //   const subs = subreddits.map(sub => ({ subreddit: sub.toLocaleLowerCase() }))

  //   return getConnection()
  //     .createQueryBuilder()
  //     .insert()
  //     .into(SubredditsMasterList)
  //     .values(subs)
  //     .orIgnore()
  //     .execute()
  // },
}

export { db }

setTimeout(() => {
  // getConnection()
  //   .createQueryRunner()
  //   .hasTable('users')
  //   .then(res => console.log(res))
  // User.save(User.create({ name: 'foo' }))
  //   .then(res => {
  //     console.log(res)
  //   })
  //   .then(() =>
  // db.getAllSubreddits()
  // .then(res => {
  // console.log(res)
  // res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  // })
  // .then(_ => db.getAllSubreddits())
  // .then(res => console.dir(JSON.stringify(res)))
  // .then(res => res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') }))
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