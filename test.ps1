$old = Get-Content "D:\uitknowledge - Copy\index.html.bak" -Raw
$html = Get-Content "D:\uitknowledge - Copy\index.html" -Raw
Write-Host "HTML length = $($html.Length)"
