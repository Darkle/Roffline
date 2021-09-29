import { Sequelize, DataTypes, Model } from 'sequelize'

type Oembed = {
  provider_url: string
  version: string
  title: string
  type: string
  thumbnail_width: number
  height: number
  width: number
  html: string
  provider_name: string
  thumbnail_url: string
  thumbnail_height: number
  author_url: string
}

type PostMediaKey = {
  type: string
  oembed: Oembed
}

type Post = {
  postId: string
  subreddit: string
  author: string
  title: string
  selftext: string
  selftext_html: string
  score: number
  is_self: boolean
  created_utc: number
  domain: string
  is_video: boolean
  stickied: boolean
  media_has_been_downloaded: boolean
  mediaDownloadTries: number
  post_hint: string
  permalink: string
  url: string
  media: PostMediaKey
  crosspost_parent: string
}

class PostModel extends Model {}

const tableSchema = {
  postId: {
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
}

const initPostModel = (sequelize: Sequelize): Promise<PostModel> => {
  PostModel.init(tableSchema, {
    sequelize,
    modelName: 'PostModel',
    tableName: 'posts',
  })
  return PostModel.sync()
}

export { initPostModel, PostModel, Post }
