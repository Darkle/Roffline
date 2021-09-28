import * as R from 'ramda'
// import * as RA from 'ramda-adjunct'
import { Sequelize } from 'sequelize'
import { match } from 'ts-pattern'
import { Maybe, get as MaybeGet, Just, Nothing, nullable as MaybeNullable } from 'pratica'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { noop } from '../server/utils'
import { mainLogger } from '../logging/logging'
import { UpdatesTrackerModel } from './entities/UpdatesTracker'
import { User, UserModel } from './entities/Users'

const dbPath = process.env['DBPATH'] || './roffline-storage.db'

/*****
  Until this (https://github.com/sequelize/sequelize/issues/12575) is fixed, we have to map
    over results and use .get() to get raw objects instead of model instances
*****/

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg): void => mainLogger.trace(msg),
})

const db = {
  sequelize,
  init(): Promise<void> {
    return firstRun(sequelize)
  },
  close(): Promise<void> {
    return sequelize.close()
  },
  getLastScheduledUpdateTime(): Promise<Maybe<string>> {
    return UpdatesTrackerModel.findByPk(1, { attributes: ['lastUpdateDateAsString'] }).then(
      MaybeGet(['lastUpdateDateAsString'])
    )
  },
  async setLastScheduledUpdateTime(date: string | Date): Promise<void> {
    await UpdatesTrackerModel.update({ lastUpdateDateAsString: date.toString() }, { where: { id: 1 } })
  },
  getUserSettings(userName: string): Promise<Maybe<User>> {
    return UserModel.findOne({ where: { name: userName } })
      .then(user => user?.get() as User)
      .then(MaybeNullable)
  },
  getUserSpecificSetting(userName: string, settingName: keyof User): Promise<Maybe<User[keyof User]>> {
    return UserModel.findOne({ where: { name: userName } }).then(MaybeGet([settingName]))
  },
  async setUserSpecificSetting(
    userName: string,
    settingName: keyof User,
    settingValue: User[keyof User]
  ): Promise<void> {
    const updateDetails = {
      settingName,
      settingValIsArray: Array.isArray(settingValue),
    }

    await match(updateDetails)
      .with({ settingName: 'subreddits', settingValIsArray: false }, () =>
        db.addUserSubreddit(userName, settingValue as string)
      )
      .with({ settingName: 'subreddits', settingValIsArray: true }, () =>
        db.batchAddUserSubreddits(userName, settingValue as string[])
      )
      .otherwise(() => UserModel.update({ [settingName]: [settingValue] }, { where: { name: userName } }))
  },
  async batchAddUserSubreddits(username: string, subreddits: string[]): Promise<void> {
    const subs = R.map(R.toLower, subreddits)

    const maybeUserSubs = await db.getUserSpecificSetting(username, 'subreddits')

    await maybeUserSubs.cata({
      Just: userSubs =>
        UserModel.update(
          { subreddits: R.uniq([...(userSubs as string[]), ...subs]) },
          { where: { name: username } }
        ),
      Nothing: noop,
    })
  },
  addUserSubreddit(username: string, subreddit: string): Promise<void> {
    return db.batchAddUserSubreddits(username, [subreddit])
  },
  getAllSubreddits(): Promise<Maybe<string[]>> {
    return SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(results =>
      R.isEmpty(results)
        ? Nothing
        : Just(results).map((subs): string[] => subs.map(item => item.get('subreddit') as string))
    )
  },
  async batchAddSubredditsToMasterList(subreddits: string[]): Promise<void> {
    const subs = subreddits.map(sub => ({ subreddit: sub.toLocaleLowerCase() }))

    await SubredditsMasterListModel.bulkCreate(subs, { ignoreDuplicates: true, fields: ['subreddit'] })
  },
}

export { db }

setTimeout(() => {
  // User.create({ name: 'Kermit' }).catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['aww', 'dogs', 'cats']).catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['cats', 'dogs', 'fish', 'rabbits']).then(res => {
  db.getUserSpecificSetting('Kermit', 'hideStickiedPosts').then(res => {
    // console.log(res)
    res
      //   //   // .map(thing => {
      //   //   //   // @ts-expect-error
      //   //   //   console.log(thing.subreddit)
      //   //   //   // @ts-expect-error
      //   //   //   return thing.subreddit // eslint-disable-line
      //   //   // })
      .cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
    // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  })
  // AdminSettings.findByPk(1).then(result => {
  //   console.log(result?.toJSON())
  // })
  // getConnection()
  //   .createQueryRunner()
  //   .hasTable('users')
  //   .then(res => console.log(res))
  // db.getLastScheduledUpdateTime()
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //     // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  //   })
  //   .then(() => db.setLastScheduledUpdateTime(new Date()))
  //   .then(res => {
  //     console.log(res)
  //   })
  //   .then(() => db.getLastScheduledUpdateTime())
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //     // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  //   })
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
