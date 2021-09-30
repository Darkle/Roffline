import * as R from 'ramda'
// import * as RA from 'ramda-adjunct'
import { Sequelize, Transaction, Op } from 'sequelize'
import { match } from 'ts-pattern'
import { Maybe, get as MaybeGet, Just, Nothing, nullable as MaybeNullable } from 'pratica'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { noop, omitDuplicateSubs } from '../server/utils'
import { mainLogger } from '../logging/logging'
import { UpdatesTrackerModel } from './entities/UpdatesTracker'
import { User, UserModel } from './entities/Users'
import {
  createAndSyncSubredditTable,
  loadSubredditTableModels,
  removeSubredditTable,
} from './entities/SubredditTable'

const dbPath = process.env['DBPATH'] || './roffline-storage.db'

type TransactionType = Transaction | null | undefined

/*****
  Notes:
    * Until this (https://github.com/sequelize/sequelize/issues/12575) is fixed, we have to map
      over results and use .get() to get raw objects instead of model instances
    * Gotta use getterMethods and setterMethods instead of regular get()/set() in classes because of
        this: https://github.com/sequelize/sequelize/issues/8953
*****/

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg): void => mainLogger.trace(msg),
})

const db = {
  sequelize,
  init(): Promise<void> {
    return firstRun(sequelize).then(() => loadSubredditTableModels(sequelize))
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
    await UpdatesTrackerModel.update({ lastUpdateDateAsString: date }, { where: { id: 1 } })
  },
  async createUser(userName: string): Promise<void> {
    await UserModel.create({ name: userName }, { ignoreDuplicates: true })
  },
  getUserSettings(userName: string): Promise<Maybe<User>> {
    return UserModel.findOne({ where: { name: userName } })
      .then(userAsModel => userAsModel?.get() as User)
      .then(MaybeNullable)
  },
  getUserSpecificSetting(userName: string, settingName: keyof User): Promise<Maybe<User[keyof User]>> {
    return UserModel.findOne({ where: { name: userName }, attributes: [settingName] }).then(
      MaybeGet([settingName])
    )
  },
  getUserSubreddits(userName: string): Promise<Maybe<User[keyof User]>> {
    return this.getUserSpecificSetting(userName, 'subreddits')
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
  async batchAddUserSubreddits(
    userName: string,
    subreddits: string[],
    transaction: TransactionType = null
  ): Promise<void> {
    const maybeUserSubs = await db.getUserSubreddits(userName)

    await maybeUserSubs.cata({
      Just: userSubs =>
        UserModel.update(
          { subreddits: omitDuplicateSubs(userSubs as string[], subreddits) },
          { where: { name: userName }, transaction }
        ),
      Nothing: noop,
    })
  },
  addUserSubreddit(userName: string, subreddit: string, transaction: TransactionType = null): Promise<void> {
    return db.batchAddUserSubreddits(userName, [subreddit], transaction)
  },
  // eslint-disable-next-line max-lines-per-function
  async removeUserSubreddit(userName: string, subreddit: string): Promise<void> {
    const subredditToRemove = subreddit.toLowerCase()
    const transaction = await sequelize.transaction()

    const maybeUserSubs = await this.getUserSubreddits(userName)

    await maybeUserSubs.cata({
      Just: userSubs =>
        UserModel.update(
          { subreddits: R.without([subredditToRemove], userSubs as string[]) },
          { where: { name: userName }, transaction }
        ),
      Nothing: noop,
    })

    const allUsersSubreddits = await UserModel.findAll({
      attributes: ['subreddits'],
      where: { name: { [Op.not]: userName } },
      transaction,
    }).then((users): string[] =>
      users.flatMap(userModelSubsAttr => userModelSubsAttr.get('subreddits') as string[])
    )

    await transaction.commit()

    const noOtherUserHasSubreddit = (allUsersSubs: string[], subToRemove: string): boolean =>
      !allUsersSubs.includes(subToRemove)

    // eslint-disable-next-line functional/no-conditional-statement
    if (noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)) {
      await removeSubredditTable(subredditToRemove)
    }
  },
  getAllSubreddits(): Promise<Maybe<string[]>> {
    return SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(results =>
      R.isEmpty(results)
        ? Nothing
        : Just(results).map((subs): string[] => subs.map(subModelAttr => subModelAttr.get('subreddit') as string))
    )
  },
  async batchAddSubredditsToMasterList(subreddits: string[], transaction: TransactionType = null): Promise<void> {
    const subs = subreddits.map(subreddit => ({ subreddit }))

    await SubredditsMasterListModel.bulkCreate(subs, {
      ignoreDuplicates: true,
      fields: ['subreddit'],
      transaction,
    })
  },
  async addSingleSubredditToMasterList(newSub: string, transaction: TransactionType = null): Promise<void> {
    await SubredditsMasterListModel.create(
      { subreddit: newSub },
      { ignoreDuplicates: true, fields: ['subreddit'], transaction }
    )
  },
  async addSubreddit(userName: string, newSub: string): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all([
        db.addSingleSubredditToMasterList(newSub, transaction),
        db.addUserSubreddit(userName, newSub, transaction),
        createAndSyncSubredditTable(newSub, sequelize, transaction),
      ])
    )
  },
  async batchAddSubreddits(userName: string, subsToAdd: string[]): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all([
        db.batchAddSubredditsToMasterList(subsToAdd, transaction),
        db.batchAddUserSubreddits(userName, subsToAdd, transaction),
        ...subsToAdd.map(sub => createAndSyncSubredditTable(sub, sequelize, transaction)),
      ])
    )
  },
}

export { db }

setTimeout(() => {
  // const awwSub = subredditTablesMap.get('aww') as SubredditMapModel
  // awwSub
  //   .create({ posts_Default: 'foo' })
  //   .then(result => console.log(result))
  //   .catch(err => console.error(err))
  // db.createUser('Merp')
  //   .then(() => db.createUser('Kermit'))
  //   .then(() => db.createUser('Michael'))
  //   .then(() => db.createUser('Ben'))
  //   .then(() => db.createUser('Karen'))
  //   .then(() => db.createUser('Liz'))
  db.removeUserSubreddit('Ben', 'poop').catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['aww', 'dogs', 'cats']).catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['cats', 'dogs', 'fish', 'rabbits']).then(res => {
  // db.getAllSubreddits()
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   })
  //   //   .then(() =>
  //   //     db.getUserSpecificSetting('Kermit', 'subreddits').then(res => {
  //   //       // console.log(res)
  //   //       res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   //     })
  //   //   )
  //   // eslint-disable-next-line max-lines-per-function
  //   .then(() =>
  //     db.batchAddSubreddits('Ben', ['poop', 'bike', 'cars', 'doors', 'light', 'television', 'speakers'])
  //   )
  //   .then(() => db.getAllSubreddits())
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   })
  //   // .then(() => db.getUserSpecificSetting('Kermit', 'subreddits'))
  //   // .then(res => {
  //   //   // console.log(res)
  //   //   res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   // })
  //   .catch(err => console.error(err))
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
