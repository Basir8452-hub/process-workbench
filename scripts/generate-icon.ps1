# 生成科幻风格应用图标
# 用法：powershell -ExecutionPolicy Bypass -File scripts/generate-icon.ps1
# 输出：build/icon.ico、build/icon.png、build/icon-512.png、public/icon.png

Add-Type -AssemblyName System.Drawing

$S = 512
$bmp = New-Object System.Drawing.Bitmap($S, $S)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-HexPath([float]$cx, [float]$cy, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $points = New-Object 'System.Drawing.PointF[]' 6
  for ($i = 0; $i -lt 6; $i++) {
    $angle = [Math]::PI / 180 * (60 * $i - 30)
    $points[$i] = New-Object System.Drawing.PointF(
      [float]($cx + $r * [Math]::Cos($angle)),
      [float]($cy + $r * [Math]::Sin($angle))
    )
  }
  $p.AddPolygon($points)
  return $p
}

$bg = New-RoundedPath 16 16 480 480 112
$bgRect = New-Object System.Drawing.Rectangle 16, 16, 480, 480
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect,
  [System.Drawing.Color]::FromArgb(255, 3, 8, 22),
  [System.Drawing.Color]::FromArgb(255, 9, 30, 66),
  55
)
$g.FillPath($bgBrush, $bg)

$innerGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 14, 116, 144))
$g.FillEllipse($innerGlow, 92, 92, 328, 328)
$innerGlow2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 37, 99, 235))
$g.FillEllipse($innerGlow2, 136, 136, 240, 240)

$g.SetClip($bg)
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 56, 189, 248), 1)
for ($x = 32; $x -lt 512; $x += 32) { $g.DrawLine($gridPen, $x, 16, $x, 496) }
for ($y = 32; $y -lt 512; $y += 32) { $g.DrawLine($gridPen, 16, $y, 496, $y) }
$scanPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(9, 148, 163, 184), 1)
for ($y = 18; $y -lt 496; $y += 3) { $g.DrawLine($scanPen, 16, $y, 496, $y) }

$tracePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(130, 34, 211, 238), 2)
$tracePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$traces = @(
  @([System.Drawing.PointF]::new(72, 118), [System.Drawing.PointF]::new(128, 118), [System.Drawing.PointF]::new(158, 88)),
  @([System.Drawing.PointF]::new(72, 150), [System.Drawing.PointF]::new(104, 150), [System.Drawing.PointF]::new(128, 126)),
  @([System.Drawing.PointF]::new(440, 118), [System.Drawing.PointF]::new(384, 118), [System.Drawing.PointF]::new(354, 88)),
  @([System.Drawing.PointF]::new(440, 150), [System.Drawing.PointF]::new(408, 150), [System.Drawing.PointF]::new(384, 126)),
  @([System.Drawing.PointF]::new(72, 394), [System.Drawing.PointF]::new(128, 394), [System.Drawing.PointF]::new(158, 424)),
  @([System.Drawing.PointF]::new(440, 394), [System.Drawing.PointF]::new(384, 394), [System.Drawing.PointF]::new(354, 424)),
  @([System.Drawing.PointF]::new(256, 40), [System.Drawing.PointF]::new(256, 68)),
  @([System.Drawing.PointF]::new(256, 472), [System.Drawing.PointF]::new(256, 444))
)
foreach ($trace in $traces) { $g.DrawLines($tracePen, $trace) }
$nodeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 103, 232, 249))
foreach ($trace in $traces) {
  $last = $trace[$trace.Length - 1]
  $g.FillEllipse($nodeBrush, $last.X - 4, $last.Y - 4, 8, 8)
}
$g.ResetClip()

$edgeGlow1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20, 34, 211, 238), 28)
$edgeGlow1.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$edgeGlow2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55, 34, 211, 238), 16)
$edgeGlow2.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$edgeGlow3 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 34, 211, 238), 6)
$edgeGlow3.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$edgeLine = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 103, 232, 249), 2)
$edgeLine.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($edgeGlow1, $bg)
$g.DrawPath($edgeGlow2, $bg)
$g.DrawPath($edgeGlow3, $bg)
$g.DrawPath($edgeLine, $bg)

$hex = New-HexPath 256 256 138
$hexFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 4, 16, 38))
$g.FillPath($hexFill, $hex)
$hexGlow1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 34, 211, 238), 24)
$hexGlow1.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$hexGlow2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(85, 34, 211, 238), 12)
$hexGlow2.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$hexEdge = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 3)
$hexEdge.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($hexGlow1, $hex)
$g.DrawPath($hexGlow2, $hex)
$g.DrawPath($hexEdge, $hex)
$innerHex = New-HexPath 256 256 112
$innerHexPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 125, 211, 252), 1.5)
$g.DrawPath($innerHexPen, $innerHex)

$arcGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55, 34, 211, 238), 10)
$arcPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 103, 232, 249), 4)
$arcPen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, 59, 130, 246), 2)
$g.DrawArc($arcGlow, 70, 70, 372, 372, 205, 80)
$g.DrawArc($arcPen, 70, 70, 372, 372, 205, 80)
$g.DrawArc($arcPen2, 70, 70, 372, 372, 25, 80)
$g.DrawArc($arcPen2, 70, 70, 372, 372, 145, 40)
$orbitDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 165, 243, 252))
$g.FillEllipse($orbitDot, 103, 82, 10, 10)
$g.FillEllipse($orbitDot, 401, 82, 10, 10)
$g.FillEllipse($orbitDot, 401, 420, 10, 10)

$top = New-RoundedPath 164 158 184 38 16
$bottom = New-RoundedPath 164 316 184 38 16
$stem = New-RoundedPath 236 158 40 196 16
$glyph = New-Object System.Drawing.Drawing2D.GraphicsPath
$glyph.AddPath($top, $false)
$glyph.AddPath($stem, $false)
$glyph.AddPath($bottom, $false)
$glyphGlow1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(35, 34, 211, 238), 26)
$glyphGlow1.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$glyphGlow2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 34, 211, 238), 12)
$glyphGlow2.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($glyphGlow1, $glyph)
$g.DrawPath($glyphGlow2, $glyph)
$glyphBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle 164, 158, 184, 196),
  [System.Drawing.Color]::FromArgb(255, 248, 250, 252),
  [System.Drawing.Color]::FromArgb(255, 186, 230, 253),
  90
)
$g.FillPath($glyphBrush, $glyph)
$glyphEdge = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 1.5)
$g.DrawPath($glyphEdge, $glyph)

$cornerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 34, 211, 238), 3)
$g.DrawLines($cornerPen, @([System.Drawing.PointF]::new(48, 92), [System.Drawing.PointF]::new(48, 48), [System.Drawing.PointF]::new(92, 48)))
$g.DrawLines($cornerPen, @([System.Drawing.PointF]::new(420, 48), [System.Drawing.PointF]::new(464, 48), [System.Drawing.PointF]::new(464, 92)))
$g.DrawLines($cornerPen, @([System.Drawing.PointF]::new(48, 420), [System.Drawing.PointF]::new(48, 464), [System.Drawing.PointF]::new(92, 464)))
$g.DrawLines($cornerPen, @([System.Drawing.PointF]::new(420, 464), [System.Drawing.PointF]::new(464, 464), [System.Drawing.PointF]::new(464, 420)))

New-Item -ItemType Directory -Force -Path build | Out-Null
New-Item -ItemType Directory -Force -Path public | Out-Null
$bmp.Save((Join-Path (Get-Location) 'build\icon-512.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$small = New-Object System.Drawing.Bitmap 256, 256
$sg = [System.Drawing.Graphics]::FromImage($small)
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$sg.DrawImage($bmp, 0, 0, 256, 256)
$sg.Dispose()
$small.Save((Join-Path (Get-Location) 'build\icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$small.Save((Join-Path (Get-Location) 'public\icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$png = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location) 'build\icon.png'))
$fs = [System.IO.File]::Create((Join-Path (Get-Location) 'build\icon.ico'))
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]1)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]32)
$bw.Write([UInt32]$png.Length)
$bw.Write([UInt32]22)
$bw.Write($png)
$bw.Close()

$small.Dispose()
$bmp.Dispose()
Get-Item build\icon.ico, build\icon.png, build\icon-512.png, public\icon.png | Select-Object Name, Length
