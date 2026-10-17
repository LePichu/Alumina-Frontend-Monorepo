<#
.SYNOPSIS
Starts an app's dev server, unless one is already serving its port.

.DESCRIPTION
The desktop app's `beforeDevCommand` (packages/desktop/src-tauri/tauri.conf.json):
the window loads the slicer from its dev server, so the server has to be up.

The dev servers are often left running (`pnpm dev`), and their ports are pinned
with strictPort, so starting a second one would fail. If the port already
answers there is nothing to do and this returns at once. Otherwise it runs the
package's dev server in the foreground, where Tauri stops it when the window
closes.

.EXAMPLE
./scripts/Start-DevServer.ps1 -Package slicer -Port 4300
#>
[CmdletBinding()]
param(
	[Parameter(Mandatory)]
	[ValidateSet('design', 'slicer', 'hub', 'agentic')]
	[string] $Package,

	[Parameter(Mandatory)]
	[ValidateRange(1, 65535)]
	[int] $Port
)

$ErrorActionPreference = 'Stop'

# Vite listens on "localhost", which is ::1 on some machines and 127.0.0.1 on
# others, so ask by name and let the resolver try both.
$client = [System.Net.Sockets.TcpClient]::new()
try {
	$client.Connect('localhost', $Port)
	Write-Host "@alumina/$Package is already serving on port $Port."
	return
}
catch [System.Net.Sockets.SocketException] {
	# Nothing is listening: start it below.
}
finally {
	$client.Dispose()
}

& pnpm --filter "@alumina/$Package" dev
exit $LASTEXITCODE
