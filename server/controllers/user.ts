import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import { Maybe } from 'pratica'
import R from 'ramda'
import * as RA from 'ramda-adjunct'

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
interface FastifyReqWithSettingsBody extends Body {
  settingName: keyof User
  settingValue: User[keyof User]
}

async function updateUserSetting(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { settingName, settingValue } = req.body as FastifyReqWithSettingsBody
  const user = req.cookies['loggedInUser'] as string

  await db.setUserSpecificSetting(user, settingName, settingValue)

  return reply.status(HttpStatusCode.OK).send()
}

function logUserOut(_: unknown, reply: FastifyReply): void {
  reply.clearCookie('loggedInUser').redirect('/login')
}

const isApiRoute = R.startsWith('/api/')
const isValidCookie = RA.isNotNilOrEmpty
const isLoginLogoutPage = (path: string): boolean => path === '/login' || path === '/logout'

function checkUserLoggedIn(req: FastifyRequest, reply: FastifyReply): FastifyReply | void {
  const loggedInUser = req.cookies['loggedInUser'] as string | null
  const path = req.urlData().path as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (isValidCookie(loggedInUser) || isLoginLogoutPage(path)) return

  return isApiRoute(path)
    ? reply.status(HttpStatusCode.UNAUTHORIZED).send()
    : reply.status(HttpStatusCode.UNAUTHORIZED).redirect('/login')
}

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReqWithUsernameBody extends FastifyRequest {
  username: string
}

async function logUserIn(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { username } = req.body as FastifyReqWithUsernameBody

  const maybeUser: Maybe<User> = await db.findUser(username)

  maybeUser.cata({
    Just: () => reply.setCookie('loggedInUser', username, getCookieProperties()).redirect('/'),
    Nothing: () => reply.status(HttpStatusCode.BAD_REQUEST).send('User Does Not Exist'),
  })
}

async function createUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userName } = req.body as FastifyReqWithUsernameBody

  await db.createUser(userName)

  reply.status(HttpStatusCode.CREATED).cookie('loggedInUser', userName, getCookieProperties()).redirect('/')
}

export { getUserSettings, updateUserSetting, logUserOut, checkUserLoggedIn, logUserIn, createUser }
