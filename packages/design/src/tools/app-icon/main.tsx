import { render } from "solid-js/web"
// The playground's stylesheet: the system's theme, and its sources scanned.
import "../../playground/app.css"
import { AppIconPage } from "./AppIcon"

const root = document.getElementById("root")
if (!root) throw new Error("app icon: #root is missing from app-icon.html")

render(() => <AppIconPage />, root)
