import * as R from 'ramda'
import { Sequelize, DataTypes, ModelType } from 'sequelize'

import { noop } from '../../server/utils'
import { SubredditsMasterListModel } from './SubredditsMasterList'

type SubredditTable = {
  posts_Default: string | null
  topPosts_Day: string | null
  topPosts_Week: string | null
  topPosts_Month: string | null
  topPosts_Year: string | null
  topPosts_All: string | null
}

/*****
  Since the subreddit tables are created dynamically, we need to store a reference to their
  models somewhere. A Map seems like a good idea for that.
*****/
const subredditTablesMap: Map<string, ModelType> = new Map()

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

async function createSubredditTable(subreddit: string, sequelize: Sequelize): Promise<void> {
  const subTableName = `subreddit_table_${subreddit.toLowerCase()}`

  const subModel = sequelize.define(subTableName, tableSchema, {
    tableName: subTableName,
    timestamps: false,
  })

  await subModel.sync().then(() => subredditTablesMap.set(subTableName, subModel))
}

async function loadSubredditTableModels(sequelize: Sequelize): Promise<void> {
  await SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subreddits =>
    R.empty(subreddits) ? noop() : Promise.all(subreddits.map(sub => createSubredditTable(sub, sequelize)))
  )
}

export { SubredditTable, createSubredditTable, loadSubredditTableModels, subredditTablesMap }
