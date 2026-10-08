import { Profile } from '@/config/types'

type ProfileAuth = Pick<Profile, 'url' | 'token'>

/** Profile with neither URL nor token: Claude Code authenticates via its own `/login` */
export const isLoginModeProfile = (profile: ProfileAuth): boolean => !profile.url && !profile.token

/** A token without a URL would be sent to the official API instead of `/login` auth — rejected */
export const hasTokenWithoutUrl = (profile: ProfileAuth): boolean => !profile.url && !!profile.token

export const TOKEN_WITHOUT_URL_HINT = 'Set a URL with -u <url>, or clear the token with -t "" to use Claude Code login.'
