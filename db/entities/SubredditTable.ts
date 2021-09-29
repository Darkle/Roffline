import { Sequelize, DataTypes, ModelCtor, Model } from 'sequelize'

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
  From ModelCtor type definition: ModelCtor<M extends Model> = typeof Model & { new(): M };
  Its mostly just Model type.
*****/
type SubredditMapModel = ModelCtor<Model>

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

async function createSubredditTable(subreddit: string, sequelize: Sequelize): Promise<void> {
  const subLower = subreddit.toLowerCase()
  const subTableName = `subreddit_table_${subLower}`

  const subModel = sequelize.define(subTableName, tableSchema, {
    tableName: subTableName,
    timestamps: false,
  })
  console.log(typeof subModel)
  console.log(subModel)
  await subModel.sync().then(() => subredditTablesMap.set(subLower, subModel))
}

async function loadSubredditTableModels(sequelize: Sequelize): Promise<void> {
  await SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subreddits =>
    Promise.all(subreddits.map(sub => createSubredditTable(sub.get('subreddit') as string, sequelize)))
  )
}

export { SubredditTable, createSubredditTable, loadSubredditTableModels, subredditTablesMap, SubredditMapModel }
