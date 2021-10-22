import crypto from 'crypto'

import { FastifyRequest, FastifyReply } from 'fastify'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'
import { Maybe } from 'pratica'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import diceware from 'diceware'

import { db } from '../../db/db'
import { User } from '../../db/entities/Users/User'

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

const isLoginLogoutPage = (path: string): boolean =>
  path === '/login' || path === '/login/' || path === '/logout' || path === '/logout/'

type FastifyReplyWithLocals = {
  locals: ReplyLocals
} & FastifyReply

type ReplyLocals = {
  userSettings: User
}

async function getUserSettings(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = req.cookies['loggedInUser'] as string

  await db.getUserSettings(user).then(userSettings => {
    const replyWithLocals = reply as FastifyReplyWithLocals
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

type RequestWithUsernameBody = {
  userName: string
}

async function logUserIn(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userName } = req.body as RequestWithUsernameBody

  const maybeUser: Maybe<User> = await db.findUser(userName.trim())

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
