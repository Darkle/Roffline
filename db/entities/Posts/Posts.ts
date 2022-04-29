import type { ModelSetterOptions, Sequelize } from 'sequelize'
import { DataTypes, Model } from 'sequelize'

class PostModel extends Model {}

const tableSchema = {
  id: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
  subreddit: {
    /*****
      CITEXT is case-insesitive text column (aka TEXT COLLATE NOCASE)
      https://sequelize.org/master/class/lib/data-types.js~CITEXT.html
      https://sequelize.org/v5/file/lib/dialects/sqlite/data-types.js.html#lineNumber87
    *****/
    type: DataTypes.CITEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
  author: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  selftext: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  selftext_html: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  score: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  is_self: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  //  created_utc is a unix timestamp (ie the number of seconds since the epoch)
  created_utc: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  domain: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_video: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  stickied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  media_has_been_downloaded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  mediaDownloadTries: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 3 }, // eslint-disable-line @typescript-eslint/no-magic-numbers
  },
  post_hint: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  permalink: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  crosspost_parent: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  commentsDownloaded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}

/*****
  Ran into issue with a post (udn9jk) including unicode null character `\u0000` in the title, so
  we have these setter methods to handle that.
  https://stackoverflow.com/questions/22809401/
*****/
const setterMethods: ModelSetterOptions<PostModel> = {
  title(string?: string): void {
    // eslint-disable-next-line functional/no-conditional-statement
    if (string) {
      this.setDataValue('title', string.replace(/\0/gu, ''))
    }
  },
  selftext(string?: string): void {
    // eslint-disable-next-line functional/no-conditional-statement
    if (string) {
      this.setDataValue('selftext', string.replace(/\0/gu, ''))
    }
  },
  selftext_html(string?: string): void {
    // eslint-disable-next-line functional/no-conditional-statement
    if (string) {
      this.setDataValue('selftext_html', string.replace(/\0/gu, ''))
    }
  },
}

const initPostModel = (sequelize: Sequelize): Promise<PostModel> => {
  PostModel.init(tableSchema, {
    sequelize,
    modelName: 'PostModel',
    tableName: 'posts',
    timestamps: false,
    setterMethods,
  })
  return PostModel.sync()
}

export { initPostModel, PostModel }
