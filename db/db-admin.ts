import { QueryTypes, Sequelize } from 'sequelize'

import { AdminSettings, AdminSettingsModel } from './entities/AdminSettings'
import { TableModelTypes } from './entities/entity-types'

/* eslint-disable max-lines-per-function */

function getAdminSettings(): Promise<AdminSettings> {
  return AdminSettingsModel.findByPk(1).then(item => item?.get() as AdminSettings)
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

function adminListTablesInDB(sequelize: Sequelize): Promise<{ name: string }[]> {
  return sequelize.showAllSchemas({ logging: false }) as Promise<{ name: string }[]>
}

function adminGetAnyTableDataPaginated(
  sequelize: Sequelize,
  tableName: string,
  page = 1
): Promise<{ rows: TableModelTypes[]; count: number }> {
  const limit = 200
  const offset = (page - 1) * limit
  const defaultQueryOptions = { raw: true, type: QueryTypes.SELECT }

  return sequelize.transaction(transaction =>
    Promise.all([
      sequelize.query(`SELECT * FROM ? LIMIT ? ${page > 1 ? 'OFFSET ?' : ''}`, {
        replacements: [tableName, limit, offset],
        transaction,
        ...defaultQueryOptions,
      }) as Promise<TableModelTypes[]>,
      sequelize.query('SELECT COUNT(*) as `count` from ?', {
        replacements: [tableName],
        transaction,
        ...defaultQueryOptions,
      }) as Promise<[[{ count: number }], unknown]>,
    ]).then(
      ([rows, count]: [TableModelTypes[], [[{ count: number }], unknown]]): {
        rows: TableModelTypes[]
        count: number
      } => ({
        rows,
        count: count[0][0].count,
      })
    )
  )
}

type ColumnInfoType = {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: any // eslint-disable-line @typescript-eslint/no-explicit-any
  pk: number
}

async function adminSearchAnyDBTable(
  sequelize: Sequelize,
  tableName: string,
  searchTerm: string,
  page = 1
): Promise<{ rows: TableModelTypes[]; count: number }> {
  const limit = 200
  const offset = (page - 1) * limit
  const defaultQueryOptions = { raw: true, type: QueryTypes.SELECT }
  const wrappedSearchTerm = `%${searchTerm}%`

  const onlyTextColumns = (columns: ColumnInfoType[]): ColumnInfoType[] =>
    columns.filter((item: ColumnInfoType) => item?.type?.toLowerCase() === 'text')

  const getColumnName = (columns: ColumnInfoType[]): string[] => columns.map(column => column.name)

  const textColumnNamesForTable = await (
    sequelize.query(`PRAGMA table_info(?)`, {
      replacements: [tableName],
      ...defaultQueryOptions,
    }) as Promise<ColumnInfoType[]>
  )
    .then(onlyTextColumns)
    .then(getColumnName)

  const tableColumnSearchQueries = textColumnNamesForTable
    .map(tabName => `${tabName} LIKE :wrappedSearchTerm`)
    .join(' OR ')

  return sequelize.transaction(transaction =>
    Promise.all([
      sequelize.query(
        `SELECT * FROM :tableName WHERE ${tableColumnSearchQueries} LIMIT :limit ${
          page > 1 ? 'OFFSET :offset' : ''
        }`,
        {
          replacements: { tableName, wrappedSearchTerm, limit, offset },
          transaction,
          ...defaultQueryOptions,
        }
      ) as Promise<TableModelTypes[]>,
      sequelize.query(`SELECT COUNT(*) as count FROM :tableName WHERE ${tableColumnSearchQueries}`, {
        replacements: { tableName, wrappedSearchTerm },
        transaction,
        ...defaultQueryOptions,
      }) as Promise<[[{ count: number }], unknown]>,
    ]).then(
      ([rows, count]: [TableModelTypes[], [[{ count: number }], unknown]]): {
        rows: TableModelTypes[]
        count: number
      } => ({
        rows,
        count: count[0][0].count,
      })
    )
  )
}

export {
  getAdminSettings,
  getSingleAdminSetting,
  adminListTablesInDB,
  setAdminData,
  adminGetAnyTableDataPaginated,
  adminSearchAnyDBTable,
}
