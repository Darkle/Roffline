import * as R from 'ramda'
import { match } from 'ts-pattern'
import { nullable as MaybeNullable, Maybe } from 'pratica'
import { Transaction, Op, Sequelize } from 'sequelize'

import { User } from './entities/Users/User'
import { removeSubredditTable } from './entities/SubredditTable'
import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { noop } from '../server/utils'
import { UserModel } from './entities/Users/Users'

type TransactionType = Transaction | null | undefined

async function createUser(userName: string): Promise<void> {
  await UserModel.create({ name: userName }, { ignoreDuplicates: true })
}

function getUserSettings(userName: string): Promise<User> {
  return UserModel.findOne({ where: { name: userName } }).then(userAsModel => userAsModel?.get() as User)
}

function findUser(userName: string): Promise<Maybe<User>> {
  return getUserSettings(userName).then(MaybeNullable)
}

function getSpecificUserSetting(userName: string, settingName: keyof User): Promise<User[keyof User]> {
  return UserModel.findOne({ where: { name: userName }, attributes: [settingName] }).then(
    user => user?.get(settingName) as User[keyof User]
  )
}

function getUserSubreddits(userName: string): Promise<string[]> {
  return getSpecificUserSetting(userName, 'subreddits') as Promise<string[]>
}

async function batchAddUserSubreddits(
  userName: string,
  subreddits: string[],
  transaction: TransactionType = null
): Promise<void> {
  const userSubs = await getUserSubreddits(userName)

  const omitDuplicateSubs = (currentSubs: string[], newSubs: string[]): string[] => {
    const currentSubsLowercase = currentSubs.length ? currentSubs.map((sub: string) => sub.toLowerCase()) : []
    // Lowercase new subs in case they misstype and add a duplicate - e.g. Cats and then CAts
    const newSubsLowercase = newSubs.map((sub: string) => sub.toLowerCase())

    return R.uniq([...currentSubsLowercase, ...newSubsLowercase])
  }

  await UserModel.update(
    { subreddits: omitDuplicateSubs(userSubs, subreddits) },
    { where: { name: userName }, transaction }
  )
}

function addUserSubreddit(
  userName: string,
  subreddit: string,
  transaction: TransactionType = null
): Promise<void> {
  return batchAddUserSubreddits(userName, [subreddit], transaction)
}

async function setUserSpecificSetting(
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
      addUserSubreddit(userName, settingValue as string)
    )
    .with({ settingName: 'subreddits', settingValIsArray: true }, () =>
      batchAddUserSubreddits(userName, settingValue as string[])
    )
    .otherwise(() => UserModel.update({ [settingName]: settingValue }, { where: { name: userName } }))
}

function getAllUsersSubredditsBarOneUser(
  userToOmit: string,
  transaction: TransactionType = null
): Promise<string[]> {
  return UserModel.findAll({
    attributes: ['subreddits'],
    where: { name: { [Op.not]: userToOmit } },
    transaction,
  }).then((users): string[] =>
    users.flatMap(userModelSubsAttr => userModelSubsAttr.get('subreddits') as string[])
  )
}

// eslint-disable-next-line max-lines-per-function
async function removeUserSubreddit(sequelize: Sequelize, userName: string, subreddit: string): Promise<void> {
  const subredditToRemove = subreddit.toLowerCase()

  const removeSubFromUser = async (userSubs: string[], transaction: Transaction): Promise<void> => {
    await UserModel.update(
      { subreddits: R.without([subredditToRemove], userSubs) },
      { where: { name: userName }, transaction }
    )
  }

  const noOtherUserHasSubreddit = (allUsersSubs: string[], subToRemove: string): boolean =>
    !allUsersSubs.includes(subToRemove)

  await sequelize
    .transaction(async transaction => {
      await getUserSubreddits(userName).then((userSubs: User[keyof User]) =>
        removeSubFromUser(userSubs as string[], transaction)
      )

      return getAllUsersSubredditsBarOneUser(userName, transaction)
    })
    .then(
      (allUsersSubreddits): Promise<void> =>
        noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)
          ? Promise.all([
              removeSubredditTable(subredditToRemove),
              SubredditsMasterListModel.destroy({ where: { subreddit: subredditToRemove } }),
            ]).then(noop)
          : Promise.resolve()
    )
}

function getAllSubreddits(): Promise<string[]> {
  return SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subs =>
    subs.map(subModelAttr => subModelAttr.get('subreddit') as string)
  )
}

export {
  createUser,
  findUser,
  getUserSettings,
  getSpecificUserSetting,
  getUserSubreddits,
  setUserSpecificSetting,
  batchAddUserSubreddits,
  addUserSubreddit,
  getAllUsersSubredditsBarOneUser,
  removeUserSubreddit,
  getAllSubreddits,
}
