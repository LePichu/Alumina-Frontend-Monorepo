/** The only way to the Alumina cloud: the account, the newsletter, and sync.
 *
 * Nothing behind it exists yet — quarry's backend is an open decision — so the
 * account and the news come from src/fixtures, and sync and the newsletter say
 * plainly that there is nowhere to send anything rather than pretending to. A real client
 * replaces the bodies here and no component changes.
 */

import { ACCOUNT, NEWS } from "../fixtures/cloud"

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

export type SyncResult = { ok: true; at: number } | { ok: false; reason: string }

export function getAccount(): Promise<Account> {
	return Promise.resolve(ACCOUNT)
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
