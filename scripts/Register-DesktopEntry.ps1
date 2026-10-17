<#
.SYNOPSIS
Tells the desktop about the desktop app: its name, its icon, and how to start it.

.DESCRIPTION
On Linux the desktop finds a running window's icon and name through a .desktop
entry whose name matches the window's application id. The app sets that id to
its bundle identifier (`enableGTKAppId` in tauri.conf.json), and this writes the
entry under the same name, with the icons in the user's own icon theme:

  ~/.local/share/applications/<identifier>.desktop
  ~/.local/share/icons/hicolor/<size>/apps/<identifier>.png   (32 to 512, and 512@2)
  ~/.local/share/icons/hicolor/scalable/apps/<identifier>.svg

Without it GNOME shows a running foundry with a blank icon and no name, in
development and from a build alike. With it the dock, the overview and the app
grid show the tile, and the app grid can start the release build.

Run from inside the container, the entry starts the app through
`distrobox enter`, since the binary links against the container's libraries.
Nothing outside those paths is touched; -Remove takes them away again.

.EXAMPLE
./scripts/Register-DesktopEntry.ps1

.EXAMPLE
./scripts/Register-DesktopEntry.ps1 -Remove
#>
[CmdletBinding()]
param(
	# The binary the entry starts. The release build, unless told otherwise.
	[string] $Binary = (Join-Path $PSScriptRoot '../packages/desktop/src-tauri/target/release/alumina-desktop'),

	# Takes the entry and its icons away.
	[switch] $Remove
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$tauri = Join-Path $root 'packages/desktop/src-tauri'

# The name and the id are the app's own, from its config, not restated here.
$config = Get-Content -Raw (Join-Path $tauri 'tauri.conf.json') | ConvertFrom-Json
$id = $config.identifier
$name = $config.productName

$data = if ($env:XDG_DATA_HOME) { $env:XDG_DATA_HOME } else { Join-Path $HOME '.local/share' }
$entry = Join-Path $data "applications/$id.desktop"
$hicolor = Join-Path $data 'icons/hicolor'

# Each icon Tauri renders, by the size the theme files it under.
$icons = [ordered]@{
	'32x32'     = '32x32.png'
	'64x64'     = '64x64.png'
	'128x128'   = '128x128.png'
	'256x256'   = '128x128@2x.png'
	'512x512'   = 'icon.png'
	# The 1024 export: the largest size the theme has, at a screen's double scale.
	'512x512@2' = '512x512@2x.png'
	'scalable'  = 'icon.svg'
}

if ($Remove) {
	Remove-Item -Force -ErrorAction SilentlyContinue $entry
	foreach ($size in $icons.Keys) {
		$extension = [System.IO.Path]::GetExtension($icons[$size])
		Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $hicolor "$size/apps/$id$extension")
	}
	Write-Host "Removed $id from the desktop."
	return
}

foreach ($size in $icons.Keys) {
	$source = Join-Path $tauri "icons/$($icons[$size])"
	if (-not (Test-Path $source)) { throw "Missing ${source}: render the icon set first, with 'pnpm --filter @alumina/desktop tauri icon <image>'." }
	$dir = Join-Path $hicolor "$size/apps"
	New-Item -ItemType Directory -Force -Path $dir | Out-Null
	$extension = [System.IO.Path]::GetExtension($source)
	Copy-Item -Force $source (Join-Path $dir "$id$extension")
}

$binaryPath = [System.IO.Path]::GetFullPath($Binary)
if (-not (Test-Path $binaryPath)) {
	Write-Warning "No build at $binaryPath yet: the icon shows, but the app grid cannot start it until 'pnpm --filter @alumina/desktop build'."
}
# Inside distrobox the binary needs the container's libraries, so the desktop
# (which is the host) has to start it through the container.
$exec = if ($env:CONTAINER_ID) { "distrobox enter $($env:CONTAINER_ID) -- `"$binaryPath`"" } else { "`"$binaryPath`"" }

New-Item -ItemType Directory -Force -Path (Split-Path $entry) | Out-Null
Set-Content -Path $entry -Encoding utf8NoBOM -Value @"
[Desktop Entry]
Type=Application
Name=$name
GenericName=PCB slicer
Comment=Slice IPC-2581 boards for the Alumina Z1
Exec=$exec
Icon=$id
StartupWMClass=$id
StartupNotify=true
Terminal=false
Categories=Development;Electronics;Engineering;
"@

# Best effort: the desktop also notices new files on its own, just less quickly.
if (Get-Command gtk-update-icon-cache -ErrorAction SilentlyContinue) {
	& gtk-update-icon-cache --quiet --force --ignore-theme-index $hicolor 2>$null
}

Write-Host "Registered $name ($id): $entry"
