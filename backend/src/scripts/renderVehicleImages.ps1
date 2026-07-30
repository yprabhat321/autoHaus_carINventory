param(
  [Parameter(Mandatory = $true)][string]$ManifestPath,
  [Parameter(Mandatory = $true)][string]$ProjectRoot
)

Add-Type -AssemblyName System.Drawing

$outputDirectory = Join-Path $ProjectRoot 'frontend\public\images\vehicle-catalog'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$vehicles = Get-Content -Raw $ManifestPath | ConvertFrom-Json
$palette = @(
  [System.Drawing.Color]::FromArgb(210, 19, 21, 26),
  [System.Drawing.Color]::FromArgb(210, 126, 36, 26),
  [System.Drawing.Color]::FromArgb(210, 36, 56, 78),
  [System.Drawing.Color]::FromArgb(210, 57, 71, 57),
  [System.Drawing.Color]::FromArgb(210, 75, 45, 80),
  [System.Drawing.Color]::FromArgb(210, 85, 65, 38)
)

foreach ($vehicle in $vehicles) {
  $sourcePath = Join-Path $ProjectRoot ("frontend\public" + $vehicle.baseImage.Replace('/', '\\'))
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $canvas = New-Object System.Drawing.Bitmap 1200, 800
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  $sourceRatio = $source.Width / $source.Height
  $targetRatio = 1.5
  if ($sourceRatio -gt $targetRatio) {
    $cropHeight = $source.Height
    $cropWidth = [int]($cropHeight * $targetRatio)
    $cropX = [int](($source.Width - $cropWidth) * (($vehicle.index % 11) / 10))
    $cropY = 0
  } else {
    $cropWidth = $source.Width
    $cropHeight = [int]($cropWidth / $targetRatio)
    $cropX = 0
    $cropY = [int](($source.Height - $cropHeight) * (($vehicle.index % 11) / 10))
  }
  $destination = New-Object System.Drawing.Rectangle 0, 0, 1200, 800
  $graphics.DrawImage($source, $destination, $cropX, $cropY, $cropWidth, $cropHeight, [System.Drawing.GraphicsUnit]::Pixel)

  $overlayTop = New-Object System.Drawing.Rectangle 0, 550, 1200, 250
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $palette[$vehicle.index % $palette.Count]), $overlayTop)
  $accent = [System.Drawing.Color]::FromArgb(235, 176, 141, 87)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $accent), (New-Object System.Drawing.Rectangle 0, 550, 14, 250))
  $titleFont = New-Object System.Drawing.Font 'Arial', 40, ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font 'Arial', 20, ([System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("$($vehicle.make) $($vehicle.model)", $titleFont, [System.Drawing.Brushes]::White, 44, 595)
  $graphics.DrawString("$($vehicle.year)  |  $($vehicle.category)  |  $($vehicle.fuelType)", $subtitleFont, [System.Drawing.Brushes]::White, 46, 660)
  $graphics.DrawString('AUTOHAUS INVENTORY', $subtitleFont, [System.Drawing.Brushes]::Gainsboro, 46, 712)

  $destinationPath = Join-Path $outputDirectory "$($vehicle.id).jpg"
  $canvas.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
  $source.Dispose()
}
