import { Sequelize, DataTypes, Model } from 'sequelize'

type SubredditsMasterListType = {
  subreddit: string
}

class SubredditsMasterList extends Model {}

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
  },
}

const initSubredditsMasterListModel = (sequelize: Sequelize): Promise<SubredditsMasterList> => {
  SubredditsMasterList.init(tableSchema, {
    sequelize,
    modelName: 'SubredditsMasterList',
    tableName: 'subreddits_master_list',
  })
  return SubredditsMasterList.sync()
}

export { initSubredditsMasterListModel, SubredditsMasterList, SubredditsMasterListType }
