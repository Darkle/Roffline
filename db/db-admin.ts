import lmdb from 'lmdb-store'
import { QueryTypes, Sequelize } from 'sequelize'

import { AdminSettings, AdminSettingsModel } from './entities/AdminSettings'
import { TableModelTypes } from './entities/entity-types'
import { User } from './entities/Users/User'
import { UserModel } from './entities/Users/Users'

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
): Promise<{ rows: TableModelTypes[]; totalRowsCount: number }> {
  const limit = rowLimit
  const offset = (page - 1) * limit

  return Promise.all([
    sequelize.query(`SELECT * FROM :tableName LIMIT :limit ${page > 1 ? 'OFFSET :offset' : ''}`, {
      replacements: { tableName, limit, offset },
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<TableModelTypes[]>,
    sequelize.query('SELECT COUNT(*) as `totalRowsCount` from :tableName', {
      replacements: { tableName },
      raw: true,
      type: QueryTypes.SELECT,
    }) as Promise<[{ totalRowsCount: number }]>,
  ]).then(
    ([rows, totalRowsCount]: [TableModelTypes[], [{ totalRowsCount: number }]]): {
      rows: TableModelTypes[]
      totalRowsCount: number
    } => ({
      rows,
      totalRowsCount: totalRowsCount[0].totalRowsCount,
    })
  )
}

function adminGetCommentsDBDataPaginated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commentsDB: lmdb.RootDatabase<any, lmdb.Key>,
  page = 1
): Promise<{
  rows: {
    key: lmdb.Key
    value: string
  }[]
  totalRowsCount: number
}> {
  const limit = rowLimit
  const offset = (page - 1) * limit

  // Make it promise based. Confusing if one db is promise based and other is sync.
  return Promise.resolve({
    rows: Array.from(commentsDB.getRange({ limit, offset })),
    // Loading the values might take up GB of memory, so just grab the keys to get the number of rows.
    totalRowsCount: Array.from(commentsDB.getKeys({ limit: Infinity })).length,
  })
}

function adminSearchCommentsDBDataPaginated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commentsDB: lmdb.RootDatabase<any, lmdb.Key>,
  searchTerm: string,
  page = 1
): Promise<{
  rows: {
    key: lmdb.Key
    value: string
  }[]
  totalRowsCount: number
}> {
  const limit = rowLimit
  const offset = (page - 1) * limit

  const results = commentsDB
    .getRange({ limit, offset })
    .filter(
      ({ key, value }: { key: lmdb.Key; value: string }) =>
        (key as string).includes(searchTerm) || value.includes(searchTerm)
    )

  // Make it promise based. Confusing if one db is promise based and other is sync.
  return Promise.resolve({
    rows: Array.from(results),
    // lmdb-store doesnt provide a way to get full count, so gonna fudge it.
    totalRowsCount: Infinity,
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
}
