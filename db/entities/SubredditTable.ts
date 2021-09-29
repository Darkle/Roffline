import { Sequelize, DataTypes, ModelType } from 'sequelize'

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

function createSubredditTable(subreddit: string, sequelize: Sequelize): Promise<Map<string, ModelType>> {
  const subTableName = `subreddit_table_${subreddit.toLowerCase()}`

  const subModel = sequelize.define(subTableName, tableSchema, { tableName: subTableName })

  return subModel.sync().then(() => subredditTablesMap.set(subTableName, subModel))
}

export { SubredditTable, createSubredditTable }
