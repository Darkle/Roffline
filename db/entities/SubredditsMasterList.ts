import { Sequelize, DataTypes, Model } from 'sequelize'
import { noop } from '../../server/utils'

class SubredditsMasterList extends Model {}

const tableSchema = {
  subreddit: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
}

const initSubredditsMasterListModel = (sequelize: Sequelize): Promise<void> => {
  SubredditsMasterList.init(tableSchema, {
    sequelize,
    modelName: 'FeedsToFetch',
    tableName: 'feeds_to_fetch',
  })
  return SubredditsMasterList.sync().then(noop)
}

export { initSubredditsMasterListModel, SubredditsMasterList }
