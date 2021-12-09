import crypto from 'crypto'

import type { FastifyRequest, FastifyReply } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import type { Maybe } from 'pratica'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import diceware from 'diceware'

import { db } from '../../db/db'
import type { User } from '../../db/entities/Users/User'

type CookieProps = {
  httpOnly: boolean
  sameSite: boolean
  expires: Date
  path: '/'
}

const fourYearsInMilliseconds = 125798400000

const getCookieProperties = (): CookieProps => ({
  httpOnly: true,
  sameSite: true,
  expires: new Date(Date.now() + fourYearsInMilliseconds),
  path: '/',
})

const isApiRoute = R.startsWith('/api/')

const isValidCookie = RA.isNotNilOrEmpty

const isLoginLogoutPage = (path: string): boolean =>
  path === '/login' || path === '/login/' || path === '/logout' || path === '/logout/'

type UserSettingsTemplateLocal = {
  userSettings: User
}

async function getUserSettings(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = req.cookies['loggedInUser'] as string

  await db.getUserSettings(user).then(userSettings => {
    const replyWithLocals = reply as { locals: UserSettingsTemplateLocal } & FastifyReply
    replyWithLocals.locals.userSettings = userSettings
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

function checkUserLoggedIn(
  req: FastifyRequest,
  reply: FastifyReply,
  next: (next?: Error) => void
): FastifyReply | void {
  const loggedInUser = req.cookies['loggedInUser'] as string | null
  const path = req.urlData().path as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (isValidCookie(loggedInUser) || isLoginLogoutPage(path)) return next()

  return isApiRoute(path)
    ? reply.code(HttpStatusCode.UNAUTHORIZED).send()
    : reply.code(HttpStatusCode.TEMPORARY_REDIRECT).redirect('/login')
}

function redirectLoginPageToHomeIfAlreadyLoggedIn(
  req: FastifyRequest,
  reply: FastifyReply,
  next: (next?: Error) => void
): FastifyReply | void {
  const loggedInUser = req.cookies['loggedInUser'] as string | null
  const path = req.urlData().path as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (!isValidCookie(loggedInUser) || !isLoginLogoutPage(path)) return next()

  return reply.code(HttpStatusCode.TEMPORARY_REDIRECT).redirect('/')
}

async function logUserIn(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { loginUsername } = req.body as { loginUsername: string }
  const maybeUser: Maybe<User> = await db.findUser(loginUsername.trim())

  maybeUser.cata({
    Just: () => reply.setCookie('loggedInUser', loginUsername, getCookieProperties()).redirect('/'),
    Nothing: () => reply.setCookie('userNotFound', loginUsername, getCookieProperties()).redirect('/login'),
  })
}

async function createUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { signupUsername } = req.body as { signupUsername: string }

  await db.createUser(signupUsername)

  reply.setCookie('loggedInUser', signupUsername, getCookieProperties()).redirect('/')
}

const numberOfDicewareWordsToGenerate = 4

const generateRandomUniqueUsername = (): string =>
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  `${diceware(numberOfDicewareWordsToGenerate).split(' ').join('-')}-${crypto.randomInt(0, 10)}`

export {
  getUserSettings,
  updateUserSetting,
  logUserOut,
  checkUserLoggedIn,
  logUserIn,
  createUser,
  redirectLoginPageToHomeIfAlreadyLoggedIn,
  generateRandomUniqueUsername,
}
