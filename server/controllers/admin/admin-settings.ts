import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { db } from '../../../db/db'
import { AdminSettings } from '../../../db/entities/AdminSettings'

type RequestWithSettingsBody = {
  settingName: keyof AdminSettings
  settingValue: AdminSettings[keyof AdminSettings]
}

async function updateAdminSetting(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { settingName, settingValue } = req.body as RequestWithSettingsBody

  await db.setAdminData(settingName, settingValue)

  return reply.code(HttpStatusCode.OK).send()
}

type TemplateLocalsAdminSettings = {
  adminSettings: AdminSettings
}

async function getAdminSettingsForAdminSettingsPage(_: FastifyRequest, reply: FastifyReply): Promise<void> {
  const adminSettings = await db.getAdminSettings()

  const replyWithLocals = reply as { locals: TemplateLocalsAdminSettings } & FastifyReply
  // eslint-disable-next-line functional/immutable-data
  replyWithLocals.locals = { adminSettings }
}

export { updateAdminSetting, getAdminSettingsForAdminSettingsPage }
