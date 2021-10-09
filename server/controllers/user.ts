import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { db } from '../../db/db'
import { User } from '../../db/entities/Users'

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReplyWithLocals extends FastifyReply {
  locals: ReplyLocals
}

type ReplyLocals = {
  userSettings: User
}

async function getUserSettings(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = req.cookies['loggedInUser'] as string

  await db.getUserSettings(user).then(userSettings => {
    // eslint-disable-next-line functional/immutable-data,@typescript-eslint/no-extra-semi
    ;(reply as FastifyReplyWithLocals).locals.userSettings = userSettings
  })
}

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReqWithBodySettings extends FastifyRequest {
  settingName: keyof User
  settingValue: User[keyof User]
}

async function updateUserSetting(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { settingName, settingValue } = req.body as FastifyReqWithBodySettings
  const user = req.cookies['loggedInUser'] as string

  await db.setUserSpecificSetting(user, settingName, settingValue)

  return reply.status(HttpStatusCode.OK).send()
}

export { getUserSettings, updateUserSetting }
