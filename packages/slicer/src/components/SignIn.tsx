import { createSignal, Show } from "solid-js"
import Login from "@carbon/icons/es/login/16"
import {
	Background,
	Button,
	Checkbox,
	FluidPasswordInput,
	FluidTextInput,
	Form,
	Icon,
	InlineLoading,
	InlineNotification,
	ScrollArea,
	Tile,
	TileSection,
	useAppShell,
} from "@alumina/design"
import type { NotificationKind } from "@alumina/design"
import { createAccount, PASSWORD_MIN, resetPassword, SIGN_IN_NOTE } from "../lib/cloud"
import { useStudio } from "./Studio"

/** Loose on purpose: the cloud is the judge of an address. This only catches
 *  one that cannot be one. */
const looksLikeAnAddress = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)

/** Signing in to the Alumina cloud: one form, centred on the floor.
 *
 *  Not a 25/75 `Workspace`, as other pages are. It was one, and in review it
 *  read as horrendous: a form is a single column of a few fields, so the narrow
 *  tile stood the window's height with nothing in its middle, and the wide
 *  column held a tile of reasons with the floor under it. A sign-in page is
 *  one thing to do, so it is one card.
 *
 *  A prototype over fixtures — `lib/cloud.ts` says how it answers — opened
 *  from wherever the app needs an account and has none: the start pane's foot,
 *  Settings' Account pane, Sync to cloud, the newsletter. Signing in closes it
 *  and says so on Home. Foundry works without an account, and the card says
 *  how to go on without one.
 */
export function SignInPage(props: { id: string }) {
	const studio = useStudio()
	const shell = useAppShell()
	const [email, setEmail] = createSignal("")
	const [password, setPassword] = createSignal("")
	const [stay, setStay] = createSignal(true)
	// The fields judge themselves only once a sign-in has been asked for: an
	// address half typed is not yet wrong.
	const [tried, setTried] = createSignal(false)
	const [pending, setPending] = createSignal(false)
	const [answer, setAnswer] = createSignal<
		{ kind: NotificationKind; title: string; subtitle: string }
	>()

	const emailProblem = () =>
		tried() && !looksLikeAnAddress(email().trim())
			? "Enter the address your account uses."
			: undefined
	const passwordProblem = () =>
		tried() && password().length < PASSWORD_MIN ? `At least ${PASSWORD_MIN} characters.` : undefined

	const submit = async (event: SubmitEvent) => {
		event.preventDefault()
		setTried(true)
		setAnswer(undefined)
		if (emailProblem() || passwordProblem() || pending()) return
		setPending(true)
		try {
			const result = await studio.signIn(email().trim(), password(), stay())
			if (!result.ok) setAnswer({ kind: "error", title: "Not signed in", subtitle: result.reason })
		} finally {
			setPending(false)
		}
	}

	const forgot = async () => {
		const result = await resetPassword(email().trim())
		setAnswer(
			result.ok
				? { kind: "success", title: "Link sent", subtitle: "Check your inbox." }
				: { kind: "info", title: "No link sent", subtitle: result.reason },
		)
	}

	const create = async () => {
		const result = await createAccount()
		setAnswer(
			result.ok
				? { kind: "success", title: "Account created", subtitle: "Sign in with it." }
				: { kind: "info", title: "No account created", subtitle: result.reason },
		)
	}

	return (
		<>
			<Background variant="grid" static={!studio.motion()} />
			{
				/* The card in the middle of the page, and the page scrolling when the
			    card is taller than the window, as on a phone held sideways. No fade:
			    the page has no ground of its own, only the floor. */
			}
			<ScrollArea fade={false} frameClass="relative z-10 h-full">
				<div class="flex min-h-full items-center justify-center p-4">
					<Tile
						bar
						flush
						heading={
							<>
								<Icon glyph={Login} size={16} />Sign in
							</>
						}
						meta="Alumina cloud"
						class="w-full max-w-112"
					>
						<TileSection>
							<p class="m-0 mb-4 text-small opacity-muted">
								One account for Foundry and quarry: your boards on every machine you sign in on,
								published to quarry when you choose, and the news.
							</p>
							<Form aria-label="Sign in" onSubmit={(event) => void submit(event)}>
								{
									/* Boxed: a fluid field is the system's boxed text field, the label
								    inside the box. The underlined field read as too slight for the
								    one thing this page asks for. */
								}
								<div class="flex flex-col gap-2">
									<FluidTextInput
										labelText="Email"
										type="email"
										autocomplete="email"
										value={email()}
										onInput={(event) => setEmail(event.currentTarget.value)}
										invalid={emailProblem() !== undefined}
										invalidText={emailProblem()}
									/>
									<FluidPasswordInput
										labelText="Password"
										autocomplete="current-password"
										value={password()}
										onInput={(event) => setPassword(event.currentTarget.value)}
										invalid={passwordProblem() !== undefined}
										invalidText={passwordProblem()}
									/>
								</div>
								<Checkbox
									labelText="Stay signed in on this machine"
									checked={stay()}
									onChange={setStay}
								/>
								<Show when={answer()}>
									{(said) => (
										<InlineNotification
											kind={said().kind}
											title={said().title}
											subtitle={said().subtitle}
											onClose={() => setAnswer(undefined)}
										/>
									)}
								</Show>
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Show
										when={!pending()}
										fallback={<InlineLoading description="Signing in" class="justify-center" />}
									>
										<Button type="submit" kind="primary" flat class="w-full justify-center">
											Sign in
										</Button>
									</Show>
									<Button
										kind="tertiary"
										class="w-full justify-center"
										onClick={() => void forgot()}
									>
										Forgot password?
									</Button>
								</div>
							</Form>
						</TileSection>

						<TileSection>
							<p class="m-0 mb-2 text-center text-small">No account?</p>
							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Button
									kind="tertiary"
									class="w-full justify-center"
									onClick={() => void create()}
								>
									Create one
								</Button>
								<Button
									kind="tertiary"
									class="w-full justify-center"
									onClick={() => shell.close(props.id)}
								>
									Continue without one
								</Button>
							</div>
						</TileSection>

						<Show when={SIGN_IN_NOTE}>
							{(note) => (
								<TileSection>
									<blockquote class="text-micro">
										{/* The words step back; the rule stays ink. */}
										<p class="m-0 opacity-muted">{note()}</p>
									</blockquote>
								</TileSection>
							)}
						</Show>
					</Tile>
				</div>
			</ScrollArea>
		</>
	)
}
