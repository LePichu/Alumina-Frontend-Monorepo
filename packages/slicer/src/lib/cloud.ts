/** The only way to the Alumina cloud: the account and signing in to it, the
 * newsletter, and sync.
 *
 * Nothing behind it exists yet — quarry's backend is an open decision — so the
 * account and the news come from src/fixtures, and sync and the newsletter say
 * plainly that there is nowhere to send anything rather than pretending to. A real client
 * replaces the bodies here and no component changes.
 *
 * Signing in is a prototype over the fixture account. Any address and a
 * password of at least `PASSWORD_MIN` characters signs in as it; an address at
 * `REFUSED_DOMAIN` is refused, so the page's refusal can be seen. Whether this
 * machine is signed in is kept between launches, so the sign-in page can be
 * come back to.
 */

import { ACCOUNT, NEWS, REFUSED_DOMAIN } from "../fixtures/cloud"

export type Account = {
	handle: string
	email: string
	plan: string
	/** The machine profile the account slices for. */
	machine: string
}

export type NewsItem = {
	/** ISO 8601, as every date in the apps is written. */
	date: string
	kind: "Release" | "Newsletter" | "Community"
	title: string
	body: string
}

export type SyncResult = { ok: true; at: number } | {
	ok: false
	reason: string
}

/** The shortest password the cloud takes. */
export const PASSWORD_MIN = 8

/** Kept between launches: whether this machine is signed in. */
const SESSION_KEY = "foundry.session"

/** Signed in for as long as the page lasts, without being kept. */
let forThisLaunch = false

/** Whether a sign-in is kept on this machine. Until it is signed out it is:
 *  the fixture account is who the app has always shown. */
function kept(): boolean {
	try {
		return localStorage.getItem(SESSION_KEY) !== "signed-out"
	} catch {
		return true
	}
}

function keep(state: "signed-in" | "signed-out") {
	try {
		localStorage.setItem(SESSION_KEY, state)
	} catch {
		// Nowhere to keep it: it lasts as long as the page.
	}
}

/** Who is signed in on this machine, if anyone. */
export function getAccount(): Promise<Account | undefined> {
	return Promise.resolve(forThisLaunch || kept() ? ACCOUNT : undefined)
}

export type SignInResult =
	| { ok: true; account: Account }
	| { ok: false; reason: string }

/** Signs in. `stay` keeps the sign-in after the app closes. */
export async function signIn(
	email: string,
	password: string,
	stay: boolean,
): Promise<SignInResult> {
	// About as long as a round trip, so the page's waiting state is seen.
	await new Promise((resolve) => setTimeout(resolve, 700))
	if (email.toLowerCase().endsWith(`@${REFUSED_DOMAIN}`)) {
		return {
			ok: false,
			reason: "No account uses that address. Check it, or create an account.",
		}
	}
	if (password.length < PASSWORD_MIN) {
		return { ok: false, reason: "That password is too short to be anyone's." }
	}
	keep(stay ? "signed-in" : "signed-out")
	forThisLaunch = !stay
	return { ok: true, account: ACCOUNT }
}

/** How this sign-in answers, for the page to say while it is a prototype. A
 *  real client has no such note, and the page then says nothing. */
export const SIGN_IN_NOTE: string | undefined =
	`There is no Alumina cloud yet. Any address with a password of ${PASSWORD_MIN} characters or more signs in as the sample account; an address at ${REFUSED_DOMAIN} is refused. Foundry works the same either way: boards stay on this machine.`

/** Signs this machine out. */
export function signOut(): Promise<void> {
	forThisLaunch = false
	keep("signed-out")
	return Promise.resolve()
}

export type CloudResult = { ok: true } | { ok: false; reason: string }

/** Sends a link to reset the password. Not yet: there is no cloud to send it. */
export function resetPassword(email: string): Promise<CloudResult> {
	return Promise.resolve({
		ok: false,
		reason: `There is no Alumina cloud yet, so no link was sent to ${email || "you"}.`,
	})
}

/** Opens an account. Not yet: there is no cloud to open it in. */
export function createAccount(): Promise<CloudResult> {
	return Promise.resolve({
		ok: false,
		reason:
			"Accounts open with the Alumina cloud, which is not running yet. Foundry works without one.",
	})
}

export function listNews(): Promise<NewsItem[]> {
	return Promise.resolve(NEWS)
}

export type SubscribeResult = { ok: true } | { ok: false; reason: string }

/** Puts the account's address on the newsletter's list. Not yet: there is no
 *  list to put it on. */
export function joinNewsletter(email: string): Promise<SubscribeResult> {
	return Promise.resolve({
		ok: false,
		reason:
			`There is no mailing list yet, so nothing was sent to ${email}. The news is here either way.`,
	})
}

/** Sends this machine's projects to the account. Not yet: there is no cloud to
 *  send them to. */
export function syncToCloud(): Promise<SyncResult> {
	return Promise.resolve({
		ok: false,
		reason: "There is no cloud to sync to yet. Your boards stay on this machine.",
	})
}
