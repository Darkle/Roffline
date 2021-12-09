import type { Sequelize, Transaction, ModelCtor, Model } from 'sequelize'
import { DataTypes } from 'sequelize'

import { SubredditsMasterListModel } from './SubredditsMasterList'

type TopPostsTypeKeys =
  | 'posts_Default'
  | 'topPosts_Day'
  | 'topPosts_Week'
  | 'topPosts_Month'
  | 'topPosts_Year'
  | 'topPosts_All'

type SubredditTable = {
  [K in TopPostsTypeKeys]: string | null
}

type TopPostsRowType = {
  posts_Default?: string
  topPosts_Day?: string
  topPosts_Week?: string
  topPosts_Month?: string
  topPosts_Year?: string
  topPosts_All?: string
}

/*****
  From ModelCtor type definition: ModelCtor<M extends Model> = typeof Model & { new(): M };
  Its mostly just Model type.
*****/
type SubredditMapModel = ModelCtor<Model>

type TransactionType = Transaction | null | undefined

/*****
  Since the subreddit tables are created dynamically, we need to store a reference to their
  models somewhere. A Map seems like a good idea for that.
*****/
const subredditTablesMap: Map<string, SubredditMapModel> = new Map()

const tableSchema = {
  posts_Default: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  topPosts_Day: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  topPosts_Week: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  topPosts_Month: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  topPosts_Year: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  topPosts_All: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
}

const genSubTableName = (subreddit: string): string => `subreddit_table_${subreddit.toLowerCase()}`

function createSubredditTable(subreddit: string, sequelize: Sequelize): SubredditMapModel {
  const subTableName = genSubTableName(subreddit)

  return sequelize.define(subTableName, tableSchema, {
    tableName: subTableName,
    timestamps: false,
  })
}

async function createAndSyncSubredditTable(
  subreddit: string,
  sequelize: Sequelize,
  transaction: TransactionType = null
): Promise<void> {
  const subLower = subreddit.toLowerCase()
  const subModel = createSubredditTable(subreddit, sequelize)

  // @ts-expect-error Typescript thinks theres no transaction key allowed in Model.sync(), but its in the docs: https://sequelize.org/master/class/lib/model.js~Model.html#static-method-sync
  await subModel.sync({ transaction }).then(() => subredditTablesMap.set(subLower, subModel))
}

async function loadSubredditTableModels(sequelize: Sequelize): Promise<void> {
  await SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subreddits => {
    subreddits.forEach(sub => {
      const subreddit = sub.get('subreddit') as string
      const subLower = subreddit.toLowerCase()

      subredditTablesMap.set(subLower, createSubredditTable(subLower, sequelize))
      // We dont need to run subModel.sync() here as the tables are already in the DB.
    })
  })
}

async function removeSubredditTable(subredditToRemove: string): Promise<void> {
  const subModel = subredditTablesMap.get(subredditToRemove) as SubredditMapModel
  await subModel.drop()
  subredditTablesMap.delete(subredditToRemove)
}

export {
  SubredditTable,
  createSubredditTable,
  loadSubredditTableModels,
  subredditTablesMap,
  SubredditMapModel,
  createAndSyncSubredditTable,
  removeSubredditTable,
  TopPostsTypeKeys,
  TopPostsRowType,
}
