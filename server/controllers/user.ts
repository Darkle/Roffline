import { FastifyRequest, FastifyReply } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import { Maybe } from 'pratica'
import R from 'ramda'
import * as RA from 'ramda-adjunct'

import { db } from '../../db/db'
import { User } from '../../db/entities/Users'

type CookieProps = {
  httpOnly: boolean
  sameSite: boolean
  expires: Date
}

const fourYearsInMilliseconds = 125798400000
const getCookieProperties = (): CookieProps => ({
  httpOnly: true,
  sameSite: true,
  expires: new Date(Date.now() + fourYearsInMilliseconds),
})
const isApiRoute = R.startsWith('/api/')
const isValidCookie = RA.isNotNilOrEmpty
const isLoginLogoutPage = (path: string): boolean => path === '/login' || path === '/logout'

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

type RequestWithSettingsBody = {
  settingName: keyof User
  settingValue: User[keyof User]
}

async function updateUserSetting(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const { settingName, settingValue } = req.body as RequestWithSettingsBody
  const user = req.cookies['loggedInUser'] as string

  await db.setUserSpecificSetting(user, settingName, settingValue)

  return reply.code(HttpStatusCode.OK).send()
}

function logUserOut(_: unknown, reply: FastifyReply): void {
  reply.clearCookie('loggedInUser').redirect('/login')
}

function checkUserLoggedIn(req: FastifyRequest, reply: FastifyReply): FastifyReply | void {
  const loggedInUser = req.cookies['loggedInUser'] as string | null
  const path = req.urlData().path as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (isValidCookie(loggedInUser) || isLoginLogoutPage(path)) return

  return isApiRoute(path)
    ? reply.code(HttpStatusCode.UNAUTHORIZED).send()
    : reply.code(HttpStatusCode.TEMPORARY_REDIRECT).redirect('/login')
}

type RequestWithUsernameBody = {
  userName: string
}

async function logUserIn(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userName } = req.body as RequestWithUsernameBody

  const maybeUser: Maybe<User> = await db.findUser(userName)

  maybeUser.cata({
    Just: () => reply.setCookie('loggedInUser', userName, getCookieProperties()).redirect('/'),
    Nothing: () => reply.code(HttpStatusCode.BAD_REQUEST).send('User Does Not Exist'),
  })
}

async function createUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userName } = req.body as RequestWithUsernameBody

  await db.createUser(userName)

  reply.code(HttpStatusCode.CREATED).cookie('loggedInUser', userName, getCookieProperties()).redirect('/')
}

export { getUserSettings, updateUserSetting, logUserOut, checkUserLoggedIn, logUserIn, createUser }