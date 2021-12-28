import * as R from 'ramda'
import { match } from 'ts-pattern'
import type { Maybe } from 'pratica'
import { nullable as MaybeNullable } from 'pratica'
import type { Transaction, Sequelize } from 'sequelize'
import { Op } from 'sequelize'
import RA from 'ramda-adjunct'
import Prray from 'prray'

import type { User } from './entities/Users/User'
import { removeSubredditTable } from './entities/SubredditTable'
import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { UserModel } from './entities/Users/Users'
import { PostModel } from './entities/Posts/Posts'
import { batchRemovePostsFolder } from '../server/controllers/posts/remove-posts-folders'
import { noop } from '../server/utils'

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

function getAllUsersSubredditsBarOneUser(userToOmit: string): Promise<string[]> {
  return UserModel.findAll({
    attributes: ['subreddits'],
    where: { name: { [Op.not]: userToOmit } },
  }).then((users): string[] =>
    users.flatMap(userModelSubsAttr => userModelSubsAttr.get('subreddits') as string[])
  )
}

// eslint-disable-next-line max-lines-per-function,max-params
async function removeUserSubreddit(
  sequelize: Sequelize,
  batchRemovePosts: (postsToRemove: string[], transaction?: Transaction) => Promise<void>,
  batchRemoveComments: (postIdsToRemove: string[]) => Promise<void>,
  userName: string,
  subreddit: string
): Promise<void> {
  const subredditToRemove = subreddit.toLowerCase()
  // eslint-disable-next-line functional/no-let
  let postIdsFromSubWeAreRemoving: string[] = []
  const allUsersSubreddits = await getAllUsersSubredditsBarOneUser(userName)
  const noOtherUserHasSubreddit = (allUsersSubs: string[], subToRemove: string): boolean =>
    !allUsersSubs.includes(subToRemove)
  const thereAreSubsAndPostsNoLongerInUse = noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)

  await sequelize
    .transaction(async transaction => {
      await getUserSubreddits(userName).then((userSubs: string[]) =>
        UserModel.update(
          { subreddits: R.without([subredditToRemove], userSubs) },
          { where: { name: userName }, transaction }
        )
      )

      // eslint-disable-next-line functional/no-conditional-statement
      if (thereAreSubsAndPostsNoLongerInUse) {
        postIdsFromSubWeAreRemoving = await PostModel.findAll({
          where: { subreddit },
          attributes: ['id'],
        }).then(items => items.map(item => (item.get() as { id: string }).id))

        await Promise.all([
          SubredditsMasterListModel.destroy({ where: { subreddit: subredditToRemove }, transaction }),
          batchRemovePosts(postIdsFromSubWeAreRemoving, transaction),
          batchRemovePostsFolder(postIdsFromSubWeAreRemoving),
        ])
      }
    })
    /*****
      We only drop a table and remove comments after a transacion has succeded as dropping tables cant be part of
       a transaction and comments uses a different database.
    *****/
    .then(() =>
      thereAreSubsAndPostsNoLongerInUse
        ? Promise.all([
            removeSubredditTable(subredditToRemove),
            batchRemoveComments(postIdsFromSubWeAreRemoving),
          ]).then(noop)
        : Promise.resolve()
    )
}

function getAllSubreddits(): Promise<string[]> {
  return SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subs =>
    subs.map(subModelAttr => subModelAttr.get('subreddit') as string)
  )
}

// eslint-disable-next-line max-lines-per-function
async function deleteUser(
  sequelize: Sequelize,
  batchRemovePosts: (postsToRemove: string[], transaction?: Transaction) => Promise<void>,
  batchRemoveComments: (postIdsToRemove: string[]) => Promise<void>,
  userName: string
): Promise<void> {
  // eslint-disable-next-line functional/no-let
  let postIdsFromSubsWeAreRemoving: string[] = []
  const subsOfUserToDelete = await getUserSubreddits(userName)
  const otherUsersSubreddits = await getAllUsersSubredditsBarOneUser(userName)
  const subsOfUserToDeleteThatNoOtherUserHas = R.without(otherUsersSubreddits, subsOfUserToDelete)
  const thereAreSubsAndPostsNoLongerInUse = RA.isNonEmptyArray(subsOfUserToDeleteThatNoOtherUserHas)

  await sequelize
    .transaction(async transaction => {
      await UserModel.destroy({ where: { name: userName }, transaction })

      // eslint-disable-next-line functional/no-conditional-statement
      if (!thereAreSubsAndPostsNoLongerInUse) return

      await SubredditsMasterListModel.destroy({
        where: { subreddit: { [Op.in]: subsOfUserToDeleteThatNoOtherUserHas } },
        transaction,
      })

      postIdsFromSubsWeAreRemoving = await PostModel.findAll({
        where: { subreddit: { [Op.in]: subsOfUserToDeleteThatNoOtherUserHas } },
        attributes: ['id'],
      }).then(items => items.map(item => (item.get() as { id: string }).id))

      return Promise.all([
        batchRemovePosts(postIdsFromSubsWeAreRemoving, transaction),
        batchRemovePostsFolder(postIdsFromSubsWeAreRemoving),
      ])
    })
    .then(() =>
      /*****
        We only drop a table and remove comments after a transacion has succeded as dropping tables cant be part of
        a transaction and comments uses a different database.
      *****/
      thereAreSubsAndPostsNoLongerInUse
        ? Promise.all([
            Prray.from(subsOfUserToDeleteThatNoOtherUserHas).forEachAsync(sub => {
              const subreddit = sub
              return removeSubredditTable(subreddit)
            }),
            batchRemoveComments(postIdsFromSubsWeAreRemoving),
          ]).then(noop)
        : Promise.resolve()
    )
}

export {
  createUser,
  deleteUser,
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
