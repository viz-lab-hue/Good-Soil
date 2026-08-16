$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open('c:\Users\vizzu\Desktop\Good Soil\Vendor Research\GoodSoil_Master_Procurement_Database_v1.xlsx')
foreach ($sheet in $wb.Sheets) {
    Write-Host ("=== Sheet: " + $sheet.Name + " ===")
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    for ($r = 1; $r -le $rows; $r++) {
        $row = @()
        for ($c = 1; $c -le $cols; $c++) {
            $cell = $usedRange.Cells($r, $c)
            $row += [string]$cell.Text
        }
        Write-Host ($row -join " | ")
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
