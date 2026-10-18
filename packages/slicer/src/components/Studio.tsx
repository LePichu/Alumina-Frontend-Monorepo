import {
	createContext,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	onCleanup,
	onMount,
	useContext,
} from "solid-js"
import type { Accessor, Resource, Setter } from "solid-js"
import { createStore } from "solid-js/store"
import type { SetStoreFunction } from "solid-js/store"
import Activity from "@carbon/icons/es/activity/16"
import Chip from "@carbon/icons/es/chip/16"
import DocumentAdd from "@carbon/icons/es/document--add/16"
import Login from "@carbon/icons/es/login/16"
import SettingsIcon from "@carbon/icons/es/settings/16"
import { AppShell, createAppShell, Icon } from "@alumina/design"
import type { NotificationKind } from "@alumina/design"
import { APP_GLYPH, APP_TITLE } from "../lib/app"
import { getAccount, joinNewsletter, signIn, signOut, syncToCloud } from "../lib/cloud"
import type { Account, SignInResult } from "../lib/cloud"
import { isNotABoard, openFile, openStored } from "../lib/board"
import type { OpenBoard } from "../lib/board"
import { ignoreStrayDrops, replayHostDrags } from "../lib/files"
import { health, isMicaError, listOptions } from "../lib/mica"
import type { MicaHealth, MicaOptionSpec } from "../lib/mica"
import { createPreference } from "../lib/preferences"
import { listPrinters, listToolModules, MACHINE_DEFAULTS } from "../lib/printer"
import type { MachineSettings, Printer, ToolModule } from "../lib/printer"
import { createRecent } from "../lib/recent"
import type { Recent, RecentBoard } from "../lib/recent"
import { createWindowControls, ignoreStrayContextMenus } from "../lib/window"
import type { WindowControls } from "../lib/window"
import { Home } from "./home/Home"
import { JobPage } from "./JobPage"
import { ProjectPage } from "./ProjectPage"
import { SettingsPage } from "./Settings"
import type { SettingsPane } from "./Settings"
import { SignInPage } from "./SignIn"
import { SliceView } from "./SliceView"

/** Something the app has to say, said once at the top of the home screen: a
 *  dropped file that is not a board, a sync that had nowhere to go. */
export type Notice = {
	kind: NotificationKind
	title: string
	subtitle?: string
}

/** Whether mica is there to ask. */
export type Engine =
	| { state: "checking" }
	| { state: "up"; health: MicaHealth }
	| { state: "down"; reason: string }

/** What every page shares, and the ways to open one.
 *
 *  The machine is the app's, not a board's: which printer is chosen and the
 *  limits set for it hold across every open board, and Settings edits the same
 *  ones a board's Machine panel does.
 */
export type Studio = {
	/** mica: whether it is answering, and which build. */
	engine: Accessor<Engine>
	/** Asks mica again whether it is there. */
	checkEngine: () => Promise<void>
	/** mica's option table, read live from it — once it is answering. */
	micaOptions: Resource<MicaOptionSpec[]>
	/** Says what went wrong with a call to mica, on the home screen; a mica that
	 *  is not answering is marked down, so the app says so wherever it asks. */
	report: (title: string, error: unknown) => void
	printers: Resource<Printer[]>
	/** The tool modules on the chosen machine's plate. */
	modules: Resource<ToolModule[]>
	printer: Accessor<number>
	setPrinter: Setter<number>
	machine: MachineSettings
	setMachine: SetStoreFunction<MachineSettings>
	recent: Recent
	notice: Accessor<Notice | undefined>
	setNotice: Setter<Notice | undefined>
	/** The desktop window, in the desktop build; nothing in a browser. */
	window: Accessor<WindowControls | undefined>
	/** Whether the home screen's floor moves. */
	motion: Accessor<boolean>
	setMotion: (value: boolean) => void
	/** Who is signed in, if anyone — the one account every page shows. */
	account: Resource<Account | undefined>
	/** Signs in, and on success closes the sign-in page and says so on Home. */
	signIn: (
		email: string,
		password: string,
		stay: boolean,
	) => Promise<SignInResult>
	signOut: () => Promise<void>
	/** The sign-in page, in a tab of its own. */
	openSignIn: () => void
	/** Sends this machine's projects to the account, and says how it went —
	 *  or, with nobody signed in, asks them to sign in first. */
	sync: () => Promise<void>
	/** Puts the account on the newsletter's list, and says how it went. */
	subscribe: () => Promise<void>
	/** A board, in a tab of its own; going to it if it is already open. */
	openBoard: (open: OpenBoard) => void
	/** Files dropped or picked: each one that is a board opens in a tab of its
	 *  own; one that is not says so, and does not stop the rest. */
	openFiles: (files: File[]) => Promise<void>
	/** A board from the recent list, from its kept document. */
	openRecent: (entry: RecentBoard) => Promise<void>
	/** An empty project, waiting for a board. */
	newProject: () => void
	/** Settings, in a tab of their own: on `pane`, or where they were left. */
	openSettings: (pane?: SettingsPane) => void
	/** Which pane Settings shows. */
	settingsPane: Accessor<SettingsPane>
	setSettingsPane: (pane: SettingsPane) => void
	/** A board's print job. */
	openJob: (open: OpenBoard) => void
}

const StudioContext = createContext<Studio>()

/** Settings' tab: there is only ever one. */
const SETTINGS = "settings"

/** The sign-in page's tab: one, too. */
const SIGN_IN = "sign-in"

export function useStudio(): Studio {
	const studio = useContext(StudioContext)
	if (!studio) throw new Error("useStudio must be used inside Studio")
	return studio
}

export type StudioProps = {
	/** A board to open as the app starts, by mica's id for it — the
	 *  `/slice/<board>` link. It opens from its kept document. */
	open?: string
}

/** The app: every screen is a page of one `AppShell`.
 *
 *  Home is the page that is always there. Boards, empty projects, Settings and
 *  print jobs open beside it as tabs, and each keeps its state while another is
 *  showing. In the desktop build the shell's bar is also the window's frame —
 *  see `lib/window.ts`.
 *
 *  The bar's arrows walk the pages in the order they were shown: the app has no
 *  other history, since opening a tab does not change the URL.
 */
export function Studio(props: StudioProps) {
	const shell = createAppShell({ content: () => <Home /> })
	const windowControls = createWindowControls()

	const [engine, setEngine] = createSignal<Engine>({ state: "checking" })
	const checkEngine = async () => {
		try {
			setEngine({ state: "up", health: await health() })
		} catch (error) {
			setEngine({ state: "down", reason: error instanceof Error ? error.message : String(error) })
		}
	}
	// Read once mica is answering, and again if it comes back.
	const [micaOptions] = createResource(() => engine().state === "up" || undefined, listOptions)

	const [printers] = createResource(() => listPrinters())
	const [modules] = createResource(() => listToolModules())
	const [printer, setPrinter] = createSignal(0)
	const [machine, setMachine] = createStore<MachineSettings>({ ...MACHINE_DEFAULTS })
	const [notice, setNotice] = createSignal<Notice>()
	const [motion, setMotion] = createPreference("foundry.motion", true)
	const [settingsPane, setSettingsPane] = createSignal<SettingsPane>("printer")
	const [account, { refetch: rereadAccount }] = createResource(() => getAccount())
	const recent = createRecent()
	let untitled = 0

	// What is open, by name: "Foundry — BUCK-5V", and just the app's name on
	// Home. The same words go on the shell's bar, on the window (the taskbar and
	// the window switcher read that one) and on a browser's tab.
	const title = createMemo(() => {
		const showing = shell.pages().find((page) => page.id === shell.active())
		return showing && showing !== shell.pages()[0] ? `${APP_TITLE} — ${showing.title}` : APP_TITLE
	})
	createEffect(() => {
		document.title = title()
		windowControls()?.setTitle(title())
	})

	const report = (title: string, error: unknown) => {
		if (isMicaError(error) && error.code === "unreachable") {
			setEngine({ state: "down", reason: error.message })
		}
		setNotice({
			kind: "error",
			title,
			subtitle: error instanceof Error ? error.message : String(error),
		})
	}

	const studio: Studio = {
		engine,
		checkEngine,
		micaOptions,
		report,
		printers,
		modules,
		printer,
		setPrinter,
		machine,
		setMachine,
		recent,
		notice,
		setNotice,
		window: windowControls,
		motion,
		setMotion,
		account,
		async signIn(email, password, stay) {
			const result = await signIn(email, password, stay)
			if (result.ok) {
				await rereadAccount()
				shell.close(SIGN_IN)
				setNotice({
					kind: "success",
					title: `Signed in as ${result.account.handle}`,
					subtitle: stay ? "This machine stays signed in." : "Until Foundry closes.",
				})
			}
			return result
		},
		async signOut() {
			const who = account()?.handle
			await signOut()
			await rereadAccount()
			setNotice({
				kind: "info",
				title: who ? `${who} signed out` : "Signed out",
				subtitle: "Boards stay on this machine. Sign in again from the foot of the start pane.",
			})
		},
		openSignIn() {
			shell.open({
				id: SIGN_IN,
				title: "Sign in",
				description: "The Alumina cloud: sync, quarry and the news",
				renderIcon: Login,
				content: () => <SignInPage id={SIGN_IN} />,
			})
		},
		async sync() {
			if (!account()) return studio.openSignIn()
			const result = await syncToCloud()
			setNotice(
				result.ok
					? {
						kind: "success",
						title: "Synced",
						subtitle: "This machine's projects are in the cloud.",
					}
					: { kind: "info", title: "Not synced", subtitle: result.reason },
			)
		},
		async subscribe() {
			const email = account()?.email
			if (!email) return studio.openSignIn()
			const result = await joinNewsletter(email)
			setNotice(
				result.ok
					? { kind: "success", title: "Subscribed", subtitle: "The next letter comes to you." }
					: { kind: "info", title: "Not subscribed", subtitle: result.reason },
			)
		},
		openBoard(open) {
			recent.remember(open)
			const layers = open.board.layers
			shell.open({
				id: `board:${open.id}`,
				title: open.name,
				description: [
					open.header.revision,
					layers === null ? undefined : `${layers} ${layers === 1 ? "layer" : "layers"}`,
					open.file,
				].filter(Boolean).join(" · "),
				// The picture the home screen's card shows, once the board's first
				// run has drawn one.
				preview: () => recent.list().find((entry) => entry.id === open.id)?.picture,
				renderIcon: Chip,
				content: () => <SliceView open={open} />,
			})
		},
		async openFiles(files) {
			for (const file of files) {
				try {
					const result = await openFile(file)
					if (isNotABoard(result)) {
						setNotice({
							kind: "error",
							title: `${file.name} is not a board`,
							subtitle: result.reason,
						})
					} else studio.openBoard(result)
				} catch (error) {
					report(`${file.name} could not be opened`, error)
				}
			}
		},
		async openRecent(entry) {
			try {
				const open = await openStored(entry.id)
				if (open) return studio.openBoard(open)
				recent.forget(entry.id)
				setNotice({
					kind: "error",
					title: `${entry.name} is no longer kept`,
					subtitle: `Its document is gone from this machine's storage. Open ${entry.file} again.`,
				})
			} catch (error) {
				report(`${entry.name} could not be opened`, error)
			}
		},
		newProject() {
			untitled += 1
			const id = `project:${untitled}`
			shell.open({
				id,
				title: `Untitled ${untitled}`,
				description: "An empty project: add a board to it",
				renderIcon: DocumentAdd,
				content: () => <ProjectPage id={id} />,
			})
		},
		openSettings(pane) {
			if (pane) setSettingsPane(pane)
			shell.open({
				id: SETTINGS,
				title: "Settings",
				description: "The printer, the machine, the account and the window",
				renderIcon: SettingsIcon,
				content: () => <SettingsPage />,
			})
		},
		settingsPane,
		setSettingsPane,
		openJob(open) {
			shell.open({
				id: `job:${open.id}`,
				title: `${open.name} · job`,
				description: "Print-job tracking: not built yet",
				renderIcon: Activity,
				content: () => <JobPage open={open} />,
			})
		},
	}

	onMount(() => {
		onCleanup(ignoreStrayDrops())
		onCleanup(ignoreStrayContextMenus())
		onCleanup(replayHostDrags())
		void checkEngine()
	})

	onMount(async () => {
		const id = props.open
		if (!id) return
		try {
			const open = await openStored(id)
			if (open) studio.openBoard(open)
			else {
				setNotice({
					kind: "error",
					title: "No such board here",
					subtitle: `No board ${id.slice(0, 12)}… has been opened on this machine.`,
				})
			}
		} catch (error) {
			report("The board could not be opened", error)
		}
	})

	return (
		<StudioContext.Provider value={studio}>
			<AppShell
				shell={shell}
				title={title()}
				icon={<Icon glyph={APP_GLYPH} size={16} />}
				onBack={shell.back}
				onForward={shell.forward}
				canGoBack={shell.canGoBack()}
				canGoForward={shell.canGoForward()}
				onMinimize={windowControls()?.minimize}
				onMaximize={windowControls()?.toggleMaximize}
				onClose={windowControls()?.close}
				onDragStart={windowControls()?.startDragging}
				maximized={windowControls()?.maximized()}
				class="h-dvh"
			/>
		</StudioContext.Provider>
	)
}
