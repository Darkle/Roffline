import type { Sequelize } from 'sequelize'
import { DataTypes, Model } from 'sequelize'

type SubredditsMasterList = {
  subreddit: string
}

class SubredditsMasterListModel extends Model {}

const tableSchema = {
  subreddit: {
    /*****
      CITEXT is case-insesitive text column (aka TEXT COLLATE NOCASE)
      https://sequelize.org/master/class/lib/data-types.js~CITEXT.html
      https://sequelize.org/v5/file/lib/dialects/sqlite/data-types.js.html#lineNumber87
    *****/
    type: DataTypes.CITEXT,
    allowNull: false,
    primaryKey: true,
    validate: { notEmpty: true },
  },
  // lastUpdate is a Date.now() timestamp
  lastUpdate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isNumeric: true },
  },
}

const initSubredditsMasterListModel = (sequelize: Sequelize): Promise<SubredditsMasterListModel> => {
  SubredditsMasterListModel.init(tableSchema, {
    sequelize,
    modelName: 'SubredditsMasterListModel',
    tableName: 'subreddits_master_list',
    timestamps: false,
  })
  return SubredditsMasterListModel.sync()
}

export { initSubredditsMasterListModel, SubredditsMasterListModel, SubredditsMasterList }
