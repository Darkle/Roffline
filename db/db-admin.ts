import type lmdb from 'lmdb'
import type { Sequelize } from 'sequelize'
import { QueryTypes } from 'sequelize'

import type { AdminSettings } from './entities/AdminSettings'
import { AdminSettingsModel } from './entities/AdminSettings'
import type { TableModelTypes } from './entities/entity-types'
import type { User } from './entities/Users/User'
import { UserModel } from './entities/Users/Users'
import type { Comments } from './entities/Comments'
import type { CommentsDBRow } from './db'

/* eslint-disable max-lines-per-function */

function getAdminSettings(): Promise<AdminSettings> {
  return AdminSettingsModel.findByPk(1, {
    attributes: { exclude: ['id'] },
  }).then(item => item?.get() as AdminSettings)
}

function getSingleAdminSetting(
  adminSettingName: keyof AdminSettings
): Promise<AdminSettings[keyof AdminSettings]> {
  return AdminSettingsModel.findByPk(1, { attributes: [adminSettingName] }).then(
    item => item?.get(adminSettingName) as AdminSettings[keyof AdminSettings]
  )
}

async function setAdminData(
  adminSettingName: keyof AdminSettings,
  value: AdminSettings[keyof AdminSettings]
): Promise<void> {
  await AdminSettingsModel.update({ [adminSettingName]: value }, { where: { id: 1 } })
}

async function adminListTablesInDB(sequelize: Sequelize): Promise<{ name: string }[]> {
  return (sequelize.showAllSchemas({ logging: false }) as Promise<{ name: string }[]>).then(tableNames => [
    ...tableNames,
    // need to manually add the comments table name as it is a seperate lmdb db
    { name: 'comments' },
  ])
}

const rowLimit = 50

function adminGetAnyTableDataPaginated(
  sequelize: Sequelize,
  tableName: string,
  page = 1
): Promise<{ rows: TableModelTypes[]; count: number }> {
  const limit = rowLimit
  const offset = (page - 1) * limit

  return Promise.all([
    sequelize.query(`SELECT * FROM :tableName LIMIT :limit ${page > 1 ? 'OFFSET :offset' : ''}`, {
      replacements: { tableName, limit, offset },
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<TableModelTypes[]>,
    sequelize.query('SELECT COUNT(*) as `count` from :tableName', {
      replacements: { tableName },
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<[{ count: number }]>,
  ]).then(
    ([rows, count]: [TableModelTypes[], [{ count: number }]]): {
      rows: TableModelTypes[]
      count: number
    } => ({
      rows,
      count: count[0].count,
    })
  )
}

function adminGetCommentsDBDataPaginated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commentsDB: lmdb.RootDatabase<any, lmdb.Key>,
  page = 1
): Promise<{
  rows: CommentsDBRow[]
  count: number
}> {
  const limit = rowLimit
  const offset = (page - 1) * limit

  // Make it promise based. Confusing if one db is promise based and other is sync.
  return Promise.resolve({
    rows: Array.from(commentsDB.getRange({ limit, offset })),
    // Loading the values might take up GB of memory, so just grab the keys to get the number of rows.
    count: Array.from(commentsDB.getKeys({ limit: Infinity })).length,
  })
}

function adminSearchCommentsDBDataPaginated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commentsDB: lmdb.RootDatabase<any, lmdb.Key>,
  searchTerm: string
): Promise<{
  rows: CommentsDBRow[]
  count: number
}> {
  /*****
    Since there is no way to get a count of all results with lmdb without loading them all into memory,
    we are just going to limit the search results to 200 results and show them all on one page.
  *****/
  const limit = 200

  const results = Array.from(
    commentsDB.getRange({ limit }).filter(({ key, value }: { key: lmdb.Key; value: Comments }) => {
      const unpackedComments = JSON.stringify(value)

      return (key as string).includes(searchTerm) || unpackedComments.includes(searchTerm)
    })
  )

  // Make it promise based. Confusing if one db is promise based and other is sync.
  return Promise.resolve({
    rows: results,
    count: results.length,
  })
}

type ColumnInfoType = {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: any // eslint-disable-line @typescript-eslint/no-explicit-any
  pk: number
}

async function adminSearchAnyDBTablePaginated(
  sequelize: Sequelize,
  tableName: string,
  searchTerm: string,
  page = 1
): Promise<{ rows: TableModelTypes[]; count: number }> {
  const limit = rowLimit
  const offset = (page - 1) * limit
  const wrappedSearchTerm = `%${searchTerm}%`

  const onlyTextColumns = (columns: ColumnInfoType[]): ColumnInfoType[] =>
    columns.filter((item: ColumnInfoType) => item?.type?.toLowerCase() === 'text')

  const getColumnName = (columns: ColumnInfoType[]): string[] => columns.map(column => column.name)

  // prettier-ignore
  const textColumnNamesForTable = await (
    sequelize.query(`PRAGMA table_info(?)`, {
      replacements: [tableName],
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<ColumnInfoType[]>
  )
    .then(onlyTextColumns)
    .then(getColumnName)

  const tableColumnSearchQueries = textColumnNamesForTable
    .map(tabName => `${tabName} LIKE :wrappedSearchTerm`)
    .join(' OR ')

  return Promise.all([
    sequelize.query(
      `SELECT * FROM :tableName WHERE ${tableColumnSearchQueries} LIMIT :limit ${
        page > 1 ? 'OFFSET :offset' : ''
      }`,
      {
        replacements: { tableName, wrappedSearchTerm, limit, offset },
        raw: true,
        type: QueryTypes.SELECT,
      }
    ) as Promise<TableModelTypes[]>,
    sequelize.query(`SELECT COUNT(*) as count FROM :tableName WHERE ${tableColumnSearchQueries}`, {
      replacements: { tableName, wrappedSearchTerm },
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<[{ count: number }]>,
  ]).then(
    ([rows, count]: [TableModelTypes[], [{ count: number }]]): {
      rows: TableModelTypes[]
      count: number
    } => ({
      rows,
      count: count[0].count,
    })
  )
}

function getAllUsersDBDataForAdmin(): Promise<User[]> {
  return UserModel.findAll().then((users): User[] => users.flatMap(userModel => userModel.get() as User[]))
}

async function adminVacuumDB(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`VACUUM;`, { raw: true })
}

export {
  getAdminSettings,
  getSingleAdminSetting,
  adminListTablesInDB,
  setAdminData,
  adminGetAnyTableDataPaginated,
  adminSearchAnyDBTablePaginated,
  getAllUsersDBDataForAdmin,
  adminGetCommentsDBDataPaginated,
  adminSearchCommentsDBDataPaginated,
  adminVacuumDB,
}
