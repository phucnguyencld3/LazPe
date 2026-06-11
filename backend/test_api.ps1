# ========================================================
# API Test Script - LazPe Backend
# Test: Quan ly nguoi dung, Thuong hieu, Profile, Dia chi
# Tester: Huy Hoang
# ========================================================

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$BASE_URL = "http://localhost:5101"
$DATE_NOW = Get-Date -Format "dd/MM/yyyy"
$TESTER = "Huy Hoang"

# Skip SSL certificate validation for localhost
if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
    Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(
        ServicePoint srvPoint, X509Certificate certificate,
        WebRequest request, int certificateProblem) {
        return true;
    }
}
"@
}
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

# Results array
$results = @()
$stt = 0

function Test-Api {
    param(
        [string]$TestId,
        [string]$Feature,
        [string]$Description,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Steps,
        [string]$ExpectedResult,
        [hashtable]$Headers = @{},
        [string]$ContentType = "application/json",
        [string]$Priority = "Trung binh"
    )

    $script:stt++
    $actualResult = ""
    $status = "Fail"

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = $ContentType
            ErrorAction = "Stop"
        }

        # Skip SSL for Invoke-RestMethod
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            $params["SkipCertificateCheck"] = $true
        }

        if ($Body -and $Method -ne "GET") {
            $params["Body"] = $Body
        }

        $response = Invoke-RestMethod @params
        $statusCode = 200

        if ($response.success -eq $true) {
            $actualResult = "HTTP 200, $($response.message)"
            $status = "Pass"
        } elseif ($response.success -eq $false) {
            $actualResult = "HTTP 200, $($response.message)"
            # Some false responses are expected
            if ($ExpectedResult -match "400|404|success.*false") {
                $status = "Pass"
            }
        } else {
            $actualResult = "HTTP 200, Response received"
            $status = "Pass"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $actualResult = "HTTP $statusCode, $($errorBody.message)"
            } catch {
                $actualResult = "HTTP $statusCode, $errorMsg"
            }
        } else {
            $actualResult = "Error: $errorMsg"
        }

        # Check if the error status is expected
        if ($ExpectedResult -match "401" -and $actualResult -match "401") { $status = "Pass" }
        elseif ($ExpectedResult -match "400" -and $actualResult -match "400") { $status = "Pass" }
        elseif ($ExpectedResult -match "404" -and $actualResult -match "404") { $status = "Pass" }
        elseif ($ExpectedResult -match "403" -and $actualResult -match "403") { $status = "Pass" }
        elseif ($ExpectedResult -match "409" -and $actualResult -match "409") { $status = "Pass" }
    }

    # Truncate long results
    if ($actualResult.Length -gt 200) {
        $actualResult = $actualResult.Substring(0, 200) + "..."
    }

    $result = [PSCustomObject]@{
        STT = $script:stt
        "Ma Test" = $TestId
        "Loai Test" = "API"
        "Tinh Nang" = $Feature
        "Mo Ta Test Case" = $Description
        "Buoc Thuc Hien" = $Steps
        "Ket Qua Mong Doi" = $ExpectedResult
        "Ket Qua Thuc Te" = $actualResult
        "Do Uu Tien" = $Priority
        "Nguoi Thuc Hien" = $TESTER
        "Ngay Thuc Hien" = $DATE_NOW
        "Trang Thai" = $status
    }

    $script:results += $result
    
    $icon = if ($status -eq "Pass") { "[PASS]" } else { "[FAIL]" }
    Write-Host "$icon $TestId - $Description" -ForegroundColor $(if ($status -eq "Pass") { "Green" } else { "Red" })
    Write-Host "  -> $actualResult" -ForegroundColor Gray
}

# ========================================================
# STEP 1: Login as Admin to get token
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DANG NHAP ADMIN DE LAY TOKEN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$adminToken = $null
$adminUserId = $null

try {
    $loginParams = @{
        Uri = "$BASE_URL/api/Authentication/admin-login"
        Method = "POST"
        ContentType = "application/json"
        Body = '{"username":"admin","password":"123456"}'
        ErrorAction = "Stop"
    }
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        $loginParams["SkipCertificateCheck"] = $true
    }
    $loginResponse = Invoke-RestMethod @loginParams
    $adminToken = $loginResponse.token
    $adminUserId = $loginResponse.user.id
    Write-Host "[OK] Admin login thanh cong! UserId: $adminUserId" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Admin login that bai, thu login thong thuong..." -ForegroundColor Yellow
    try {
        $loginParams2 = @{
            Uri = "$BASE_URL/api/Authentication/login"
            Method = "POST"
            ContentType = "application/json"
            Body = '{"email":"admin@polybaby.com","password":"123456"}'
            ErrorAction = "Stop"
        }
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            $loginParams2["SkipCertificateCheck"] = $true
        }
        $loginResponse = Invoke-RestMethod @loginParams2
        $adminToken = $loginResponse.token
        $adminUserId = $loginResponse.user.id
        Write-Host "[OK] Login thanh cong! UserId: $adminUserId" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Khong the dang nhap. Mot so test se that bai." -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Also try to login as a normal user
$userToken = $null
$normalUserId = $null
try {
    $userLoginParams = @{
        Uri = "$BASE_URL/api/Authentication/login"
        Method = "POST"
        ContentType = "application/json"
        Body = '{"email":"admin@polybaby.com","password":"123456"}'
        ErrorAction = "Stop"
    }
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        $userLoginParams["SkipCertificateCheck"] = $true
    }
    $userLoginResponse = Invoke-RestMethod @userLoginParams
    $userToken = $userLoginResponse.token
    $normalUserId = $userLoginResponse.user.id
    Write-Host "[OK] User login thanh cong! UserId: $normalUserId" -ForegroundColor Green
} catch {
    Write-Host "[INFO] User login that bai, dung admin token cho cac test." -ForegroundColor Yellow
    $userToken = $adminToken
    $normalUserId = $adminUserId
}

$authHeaders = @{}
if ($adminToken) {
    $authHeaders = @{ "Authorization" = "Bearer $adminToken" }
}

$userAuthHeaders = @{}
if ($userToken) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
}

# ========================================================
# TEST GROUP 1: QUAN LY NGUOI DUNG (User Management)
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST: QUAN LY NGUOI DUNG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# TC-001: Get Users list
Test-Api -TestId "TC-001" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users - Lay danh sach nguoi dung (co quyen Admin)" `
    -Method "GET" -Url "$BASE_URL/api/Users?page=1&pageSize=10" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/Users?page=1&pageSize=10" `
    -ExpectedResult "HTTP 200, tra ve danh sach users va pagination" `
    -Headers $authHeaders -Priority "Cao"

# TC-002: Get Users with search
Test-Api -TestId "TC-002" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users?search=admin - Tim kiem nguoi dung theo tu khoa" `
    -Method "GET" -Url "$BASE_URL/api/Users?search=admin&page=1&pageSize=10" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/Users?search=admin" `
    -ExpectedResult "HTTP 200, tra ve danh sach users phu hop voi tu khoa 'admin'" `
    -Headers $authHeaders -Priority "Cao"

# TC-003: Get User by ID
Test-Api -TestId "TC-003" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users/{id} - Lay chi tiet nguoi dung theo ID" `
    -Method "GET" -Url "$BASE_URL/api/Users/$adminUserId" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/Users/$adminUserId" `
    -ExpectedResult "HTTP 200, tra ve thong tin chi tiet user" `
    -Headers $authHeaders -Priority "Cao"

# TC-004: Get User by invalid ID
Test-Api -TestId "TC-004" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users/{invalidId} - Lay user voi ID khong ton tai" `
    -Method "GET" -Url "$BASE_URL/api/Users/invalid-id-12345" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/Users/invalid-id-12345" `
    -ExpectedResult "HTTP 404, thong bao khong tim thay user" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-005: Get Users without token
Test-Api -TestId "TC-005" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users - Truy cap khong co token (Unauthorized)" `
    -Method "GET" -Url "$BASE_URL/api/Users" `
    -Steps "1. Goi GET /api/Users khong co Authorization header" `
    -ExpectedResult "HTTP 401, yeu cau xac thuc" `
    -Headers @{} -Priority "Cao"

# TC-006: Get User Statistics
Test-Api -TestId "TC-006" -Feature "Quan ly nguoi dung" `
    -Description "GET /api/Users/statistics - Lay thong ke nguoi dung" `
    -Method "GET" -Url "$BASE_URL/api/Users/statistics" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/Users/statistics" `
    -ExpectedResult "HTTP 200, tra ve totalUsers, activeUsers, lockedUsers" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-007: Toggle user status
Test-Api -TestId "TC-007" -Feature "Quan ly nguoi dung" `
    -Description "POST /api/Users/{id}/toggle-status - Doi trang thai user" `
    -Method "POST" -Url "$BASE_URL/api/Users/$normalUserId/toggle-status" `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Users/{userId}/toggle-status" `
    -ExpectedResult "HTTP 200, cap nhat trang thai user thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-008: Toggle back
Test-Api -TestId "TC-008" -Feature "Quan ly nguoi dung" `
    -Description "POST /api/Users/{id}/toggle-status - Doi trang thai user ve ban dau" `
    -Method "POST" -Url "$BASE_URL/api/Users/$normalUserId/toggle-status" `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Users/{userId}/toggle-status lan 2" `
    -ExpectedResult "HTTP 200, cap nhat trang thai user thanh cong" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-009: Lock User
Test-Api -TestId "TC-009" -Feature "Quan ly nguoi dung" `
    -Description "POST /api/Users/{id}/lock - Khoa tai khoan nguoi dung" `
    -Method "POST" -Url "$BASE_URL/api/Users/$normalUserId/lock" `
    -Body '{"reason":"Test lock","lockoutDays":1}' `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Users/{userId}/lock voi reason va lockoutDays" `
    -ExpectedResult "HTTP 200, khoa user thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-010: Unlock User
Test-Api -TestId "TC-010" -Feature "Quan ly nguoi dung" `
    -Description "POST /api/Users/{id}/unlock - Mo khoa tai khoan nguoi dung" `
    -Method "POST" -Url "$BASE_URL/api/Users/$normalUserId/unlock" `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Users/{userId}/unlock" `
    -ExpectedResult "HTTP 200, mo khoa user thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-011: Lock User with empty ID
Test-Api -TestId "TC-011" -Feature "Quan ly nguoi dung" `
    -Description "POST /api/Users//lock - Khoa user voi ID rong" `
    -Method "POST" -Url "$BASE_URL/api/Users/%20/lock" `
    -Body '{"reason":"Test","lockoutDays":1}' `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Users/ /lock voi ID rong" `
    -ExpectedResult "HTTP 400, thong bao User ID khong hop le" `
    -Headers $authHeaders -Priority "Trung binh"

# ========================================================
# TEST GROUP 2: QUAN LY THUONG HIEU (Supplier/Brand)
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST: QUAN LY THUONG HIEU (NCC)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# TC-012: Get All Suppliers (public)
Test-Api -TestId "TC-012" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers - Lay tat ca nha cung cap (cong khai)" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers" `
    -Steps "1. Goi GET /api/Suppliers (khong can dang nhap)" `
    -ExpectedResult "HTTP 200, tra ve danh sach tat ca nha cung cap" `
    -Headers @{} -Priority "Cao"

# TC-013: Get Suppliers Paginated
Test-Api -TestId "TC-013" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/paginated - Lay danh sach NCC co phan trang" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/paginated?page=1&pageSize=5" `
    -Steps "1. Goi GET /api/Suppliers/paginated?page=1&pageSize=5" `
    -ExpectedResult "HTTP 200, tra ve danh sach NCC voi pagination info" `
    -Headers @{} -Priority "Cao"

# TC-014: Get Suppliers Paginated with search
Test-Api -TestId "TC-014" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/paginated?searchTerm=... - Tim kiem NCC" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/paginated?page=1&pageSize=10&searchTerm=test" `
    -Steps "1. Goi GET /api/Suppliers/paginated?searchTerm=test" `
    -ExpectedResult "HTTP 200, tra ve danh sach NCC phu hop voi tu khoa" `
    -Headers @{} -Priority "Trung binh"

# TC-015: Get Active Suppliers
Test-Api -TestId "TC-015" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/active - Lay danh sach NCC dang hoat dong" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/active" `
    -Steps "1. Goi GET /api/Suppliers/active" `
    -ExpectedResult "HTTP 200, tra ve danh sach NCC co status=true" `
    -Headers @{} -Priority "Trung binh"

# TC-016: Search Suppliers
Test-Api -TestId "TC-016" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/search?searchTerm=... - Tim kiem NCC" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/search?searchTerm=a" `
    -Steps "1. Goi GET /api/Suppliers/search?searchTerm=a" `
    -ExpectedResult "HTTP 200, tra ve danh sach NCC phu hop" `
    -Headers @{} -Priority "Trung binh"

# TC-017: Search Suppliers with empty search term
Test-Api -TestId "TC-017" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/search - Tim kiem NCC voi tu khoa rong" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/search?searchTerm=" `
    -Steps "1. Goi GET /api/Suppliers/search?searchTerm= (rong)" `
    -ExpectedResult "HTTP 400, thong bao vui long nhap tu khoa" `
    -Headers @{} -Priority "Thap"

# TC-018: Get Supplier by ID
Test-Api -TestId "TC-018" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/1 - Lay chi tiet NCC theo ID" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/1" `
    -Steps "1. Goi GET /api/Suppliers/1" `
    -ExpectedResult "HTTP 200, tra ve thong tin chi tiet NCC voi ID=1" `
    -Headers @{} -Priority "Cao"

# TC-019: Get Supplier by invalid ID
Test-Api -TestId "TC-019" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/99999 - Lay NCC voi ID khong ton tai" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/99999" `
    -Steps "1. Goi GET /api/Suppliers/99999" `
    -ExpectedResult "HTTP 404, thong bao khong tim thay nha cung cap" `
    -Headers @{} -Priority "Trung binh"

# TC-020: Get Supplier by negative ID
Test-Api -TestId "TC-020" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/-1 - Lay NCC voi ID am" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/-1" `
    -Steps "1. Goi GET /api/Suppliers/-1" `
    -ExpectedResult "HTTP 400, thong bao ID khong hop le" `
    -Headers @{} -Priority "Thap"

# TC-021: Get Product Count by Supplier
Test-Api -TestId "TC-021" -Feature "Quan ly thuong hieu" `
    -Description "GET /api/Suppliers/1/product-count - Lay so san pham cua NCC" `
    -Method "GET" -Url "$BASE_URL/api/Suppliers/1/product-count" `
    -Steps "1. Goi GET /api/Suppliers/1/product-count" `
    -ExpectedResult "HTTP 200, tra ve so luong san pham cua NCC" `
    -Headers @{} -Priority "Trung binh"

# TC-022: Create Supplier
$supplierBody = @{
    supplierName = "Test NCC $(Get-Date -Format 'HHmmss')"
    contactName = "Nguoi lien he test"
    email = "testncc@test.com"
    phone = "0123456789"
    address = "123 Test Street"
    description = "Mo ta NCC test"
    status = $true
    createdBy = "admin"
} | ConvertTo-Json

Test-Api -TestId "TC-022" -Feature "Quan ly thuong hieu" `
    -Description "POST /api/Suppliers - Tao NCC moi (co quyen)" `
    -Method "POST" -Url "$BASE_URL/api/Suppliers" `
    -Body $supplierBody `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Suppliers voi du lieu hop le" `
    -ExpectedResult "HTTP 201, tao nha cung cap thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-023: Create Supplier without auth
Test-Api -TestId "TC-023" -Feature "Quan ly thuong hieu" `
    -Description "POST /api/Suppliers - Tao NCC khong co quyen (Unauthorized)" `
    -Method "POST" -Url "$BASE_URL/api/Suppliers" `
    -Body $supplierBody `
    -Steps "1. Goi POST /api/Suppliers khong co token" `
    -ExpectedResult "HTTP 401, yeu cau xac thuc" `
    -Headers @{} -Priority "Cao"

# TC-024: Create Supplier with empty name
$emptySupplierBody = @{
    supplierName = ""
    contactName = "Test"
    email = "test@test.com"
    phone = "0123456789"
    status = $true
} | ConvertTo-Json

Test-Api -TestId "TC-024" -Feature "Quan ly thuong hieu" `
    -Description "POST /api/Suppliers - Tao NCC voi ten rong (validation)" `
    -Method "POST" -Url "$BASE_URL/api/Suppliers" `
    -Body $emptySupplierBody `
    -Steps "1. Dang nhap Admin`n2. Goi POST /api/Suppliers voi supplierName rong" `
    -ExpectedResult "HTTP 400, du lieu khong hop le" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-025: Update Supplier
$updateSupplierBody = @{
    supplierName = "NCC Updated $(Get-Date -Format 'HHmmss')"
    contactName = "Updated Contact"
    email = "updated@test.com"
    phone = "0987654321"
    address = "456 Updated Street"
    description = "Mo ta cap nhat"
    status = $true
} | ConvertTo-Json

Test-Api -TestId "TC-025" -Feature "Quan ly thuong hieu" `
    -Description "PUT /api/Suppliers/1 - Cap nhat NCC" `
    -Method "PUT" -Url "$BASE_URL/api/Suppliers/1" `
    -Body $updateSupplierBody `
    -Steps "1. Dang nhap Admin`n2. Goi PUT /api/Suppliers/1 voi du lieu cap nhat" `
    -ExpectedResult "HTTP 200, cap nhat nha cung cap thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-026: Update non-existent Supplier
Test-Api -TestId "TC-026" -Feature "Quan ly thuong hieu" `
    -Description "PUT /api/Suppliers/99999 - Cap nhat NCC khong ton tai" `
    -Method "PUT" -Url "$BASE_URL/api/Suppliers/99999" `
    -Body $updateSupplierBody `
    -Steps "1. Dang nhap Admin`n2. Goi PUT /api/Suppliers/99999" `
    -ExpectedResult "HTTP 404, khong tim thay nha cung cap" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-027: Delete Supplier (non-existent to avoid deleting real data)
Test-Api -TestId "TC-027" -Feature "Quan ly thuong hieu" `
    -Description "DELETE /api/Suppliers/99999 - Xoa NCC khong ton tai" `
    -Method "DELETE" -Url "$BASE_URL/api/Suppliers/99999" `
    -Steps "1. Dang nhap Admin`n2. Goi DELETE /api/Suppliers/99999" `
    -ExpectedResult "HTTP 404, khong tim thay nha cung cap" `
    -Headers $authHeaders -Priority "Trung binh"

# ========================================================
# TEST GROUP 3: PROFILE
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST: PROFILE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# TC-028: Profile Test endpoint
Test-Api -TestId "TC-028" -Feature "Profile" `
    -Description "GET /api/ProfileApi/test - Test endpoint (cong khai)" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/test" `
    -Steps "1. Goi GET /api/ProfileApi/test (khong can dang nhap)" `
    -ExpectedResult "HTTP 200, tra ve message 'Profile API Controller works!'" `
    -Headers @{} -Priority "Thap"

# TC-029: Get Profile by UserId
Test-Api -TestId "TC-029" -Feature "Profile" `
    -Description "GET /api/ProfileApi/{userId} - Lay profile theo UserId" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/$adminUserId" `
    -Steps "1. Dang nhap`n2. Goi GET /api/ProfileApi/{userId}" `
    -ExpectedResult "HTTP 200, tra ve thong tin profile cua user" `
    -Headers $authHeaders -Priority "Cao"

# TC-030: Get Profile with invalid UserId
Test-Api -TestId "TC-030" -Feature "Profile" `
    -Description "GET /api/ProfileApi/{invalidId} - Lay profile voi ID khong ton tai" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/invalid-user-id-xyz" `
    -Steps "1. Dang nhap`n2. Goi GET /api/ProfileApi/invalid-user-id-xyz" `
    -ExpectedResult "HTTP 404, thong bao khong tim thay nguoi dung" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-031: Get Profile without token
Test-Api -TestId "TC-031" -Feature "Profile" `
    -Description "GET /api/ProfileApi/{userId} - Lay profile khong co token" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/$adminUserId" `
    -Steps "1. Goi GET /api/ProfileApi/{userId} khong co Authorization" `
    -ExpectedResult "HTTP 401, yeu cau xac thuc" `
    -Headers @{} -Priority "Cao"

# TC-032: Get Profile by Email
Test-Api -TestId "TC-032" -Feature "Profile" `
    -Description "GET /api/ProfileApi/by-email?email=admin@... - Lay profile theo email" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/by-email?email=admin@lazpe.com" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/ProfileApi/by-email?email=admin@lazpe.com" `
    -ExpectedResult "HTTP 200, tra ve profile tuong ung voi email" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-033: Get Profile by empty email
Test-Api -TestId "TC-033" -Feature "Profile" `
    -Description "GET /api/ProfileApi/by-email?email= - Lay profile voi email rong" `
    -Method "GET" -Url "$BASE_URL/api/ProfileApi/by-email?email=" `
    -Steps "1. Dang nhap Admin`n2. Goi GET /api/ProfileApi/by-email?email= (rong)" `
    -ExpectedResult "HTTP 400, thong bao Email khong duoc de trong" `
    -Headers $authHeaders -Priority "Thap"

# TC-034: Update Profile
$updateProfileBody = @{
    fullName = "Admin Updated"
    phoneNumber = "0912345678"
} | ConvertTo-Json

Test-Api -TestId "TC-034" -Feature "Profile" `
    -Description "PUT /api/ProfileApi/update?userId=... - Cap nhat profile" `
    -Method "PUT" -Url "$BASE_URL/api/ProfileApi/update?userId=$adminUserId" `
    -Body $updateProfileBody `
    -Steps "1. Dang nhap`n2. Goi PUT /api/ProfileApi/update?userId={userId} voi du lieu cap nhat" `
    -ExpectedResult "HTTP 200, cap nhat thong tin thanh cong" `
    -Headers $authHeaders -Priority "Cao"

# TC-035: Update Profile without userId
Test-Api -TestId "TC-035" -Feature "Profile" `
    -Description "PUT /api/ProfileApi/update?userId= - Cap nhat profile khong co userId" `
    -Method "PUT" -Url "$BASE_URL/api/ProfileApi/update?userId=" `
    -Body $updateProfileBody `
    -Steps "1. Dang nhap`n2. Goi PUT /api/ProfileApi/update?userId= (rong)" `
    -ExpectedResult "HTTP 400, thong bao UserId khong duoc de trong" `
    -Headers $authHeaders -Priority "Trung binh"

# TC-036: Change Password (expected to fail with wrong current password)
$changePasswordBody = @{
    currentPassword = "WrongPassword@123"
    newPassword = "NewPassword@123"
    confirmNewPassword = "NewPassword@123"
} | ConvertTo-Json

Test-Api -TestId "TC-036" -Feature "Profile" `
    -Description "POST /api/ProfileApi/change-password - Doi mat khau voi mat khau cu sai" `
    -Method "POST" -Url "$BASE_URL/api/ProfileApi/change-password?userId=$adminUserId" `
    -Body $changePasswordBody `
    -Steps "1. Dang nhap`n2. Goi POST /api/ProfileApi/change-password voi mat khau cu sai" `
    -ExpectedResult "HTTP 400, thong bao mat khau hien tai khong dung" `
    -Headers $authHeaders -Priority "Cao"

# TC-037: Change Password without userId
Test-Api -TestId "TC-037" -Feature "Profile" `
    -Description "POST /api/ProfileApi/change-password?userId= - Doi mat khau khong co userId" `
    -Method "POST" -Url "$BASE_URL/api/ProfileApi/change-password?userId=" `
    -Body $changePasswordBody `
    -Steps "1. Dang nhap`n2. Goi POST /api/ProfileApi/change-password?userId= (rong)" `
    -ExpectedResult "HTTP 400, thong bao UserId khong duoc de trong" `
    -Headers $authHeaders -Priority "Trung binh"

# ========================================================
# TEST GROUP 4: DIA CHI NGUOI DUNG (Address)
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST: DIA CHI NGUOI DUNG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# TC-038: Get Provinces
Test-Api -TestId "TC-038" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/provinces - Lay danh sach tinh/thanh pho" `
    -Method "GET" -Url "$BASE_URL/api/Address/provinces" `
    -Steps "1. Goi GET /api/Address/provinces" `
    -ExpectedResult "HTTP 200, tra ve danh sach tinh/thanh pho" `
    -Headers @{} -Priority "Cao"

# TC-039: Get Districts by Province
Test-Api -TestId "TC-039" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/districts/1 - Lay danh sach quan/huyen theo tinh" `
    -Method "GET" -Url "$BASE_URL/api/Address/districts/1" `
    -Steps "1. Goi GET /api/Address/districts/1 (ProvinceCode=1)" `
    -ExpectedResult "HTTP 200, tra ve danh sach quan/huyen cua tinh co ma 1" `
    -Headers @{} -Priority "Cao"

# TC-040: Get Wards by District
Test-Api -TestId "TC-040" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/wards/1 - Lay danh sach phuong/xa theo quan" `
    -Method "GET" -Url "$BASE_URL/api/Address/wards/1" `
    -Steps "1. Goi GET /api/Address/wards/1 (DistrictCode=1)" `
    -ExpectedResult "HTTP 200, tra ve danh sach phuong/xa cua quan co ma 1" `
    -Headers @{} -Priority "Cao"

# TC-041: Get Wards by Province
Test-Api -TestId "TC-041" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/wards-by-province/1 - Lay phuong/xa truc tiep theo tinh" `
    -Method "GET" -Url "$BASE_URL/api/Address/wards-by-province/1" `
    -Steps "1. Goi GET /api/Address/wards-by-province/1" `
    -ExpectedResult "HTTP 200, tra ve danh sach phuong/xa cua tinh" `
    -Headers @{} -Priority "Trung binh"

# TC-042: Get User Addresses
Test-Api -TestId "TC-042" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/user/{userId} - Lay danh sach dia chi cua user" `
    -Method "GET" -Url "$BASE_URL/api/Address/user/$adminUserId" `
    -Steps "1. Goi GET /api/Address/user/{userId}" `
    -ExpectedResult "HTTP 200, tra ve danh sach dia chi cua user" `
    -Headers @{} -Priority "Cao"

# TC-043: Get User Addresses with empty userId
Test-Api -TestId "TC-043" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/user/ - Lay dia chi voi userId rong" `
    -Method "GET" -Url "$BASE_URL/api/Address/user/%20" `
    -Steps "1. Goi GET /api/Address/user/ (userId rong)" `
    -ExpectedResult "HTTP 400, thong bao UserId khong duoc de trong" `
    -Headers @{} -Priority "Thap"

# TC-044: Get Default Address
Test-Api -TestId "TC-044" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/default/{userId} - Lay dia chi mac dinh cua user" `
    -Method "GET" -Url "$BASE_URL/api/Address/default/$adminUserId" `
    -Steps "1. Goi GET /api/Address/default/{userId}" `
    -ExpectedResult "HTTP 200, tra ve dia chi mac dinh hoac 404 neu chua co" `
    -Headers @{} -Priority "Cao"

# TC-045: Create Vietnam Address
$createAddressBody = @{
    userId = $adminUserId
    recipientName = "Nguoi nhan test"
    phoneNumber = "0901234567"
    provinceCode = "79"
    provinceName = "Ho Chi Minh"
    districtCode = "760"
    districtName = "Quan 1"
    wardCode = "26734"
    wardName = "Phuong Ben Nghe"
    detailAddress = "123 Nguyen Hue"
    isDefault = $false
    apiVersion = "v2"
} | ConvertTo-Json

Test-Api -TestId "TC-045" -Feature "Dia chi nguoi dung" `
    -Description "POST /api/Address/create-vietnam - Tao dia chi moi" `
    -Method "POST" -Url "$BASE_URL/api/Address/create-vietnam" `
    -Body $createAddressBody `
    -Steps "1. Goi POST /api/Address/create-vietnam voi du lieu dia chi hop le" `
    -ExpectedResult "HTTP 200, them dia chi thanh cong" `
    -Headers @{} -Priority "Cao"

# TC-046: Create Address with missing required fields
$invalidAddressBody = @{
    userId = ""
    recipientName = ""
    phoneNumber = ""
} | ConvertTo-Json

Test-Api -TestId "TC-046" -Feature "Dia chi nguoi dung" `
    -Description "POST /api/Address/create-vietnam - Tao dia chi thieu truong bat buoc" `
    -Method "POST" -Url "$BASE_URL/api/Address/create-vietnam" `
    -Body $invalidAddressBody `
    -Steps "1. Goi POST /api/Address/create-vietnam voi du lieu thieu truong bat buoc" `
    -ExpectedResult "HTTP 400, du lieu khong hop le" `
    -Headers @{} -Priority "Trung binh"

# TC-047: Update non-existent Address
$updateAddressBody = @{
    recipientName = "Updated Name"
    phoneNumber = "0912345678"
    provinceCode = "79"
    provinceName = "Ho Chi Minh"
    districtCode = "760"
    districtName = "Quan 1"
    wardCode = "26734"
    wardName = "Phuong Ben Nghe"
    detailAddress = "456 Le Loi"
    isDefault = $false
    apiVersion = "v2"
} | ConvertTo-Json

Test-Api -TestId "TC-047" -Feature "Dia chi nguoi dung" `
    -Description "PUT /api/Address/update/99999 - Cap nhat dia chi khong ton tai" `
    -Method "PUT" -Url "$BASE_URL/api/Address/update/99999" `
    -Body $updateAddressBody `
    -Steps "1. Goi PUT /api/Address/update/99999" `
    -ExpectedResult "HTTP 404, khong tim thay dia chi" `
    -Headers @{} -Priority "Trung binh"

# TC-048: Delete non-existent Address
Test-Api -TestId "TC-048" -Feature "Dia chi nguoi dung" `
    -Description "DELETE /api/Address/delete/99999 - Xoa dia chi khong ton tai" `
    -Method "DELETE" -Url "$BASE_URL/api/Address/delete/99999" `
    -Steps "1. Goi DELETE /api/Address/delete/99999" `
    -ExpectedResult "HTTP 404, khong tim thay dia chi" `
    -Headers @{} -Priority "Trung binh"

# TC-049: Set Default Address (non-existent)
Test-Api -TestId "TC-049" -Feature "Dia chi nguoi dung" `
    -Description "POST /api/Address/set-default/99999 - Dat mac dinh dia chi khong ton tai" `
    -Method "POST" -Url "$BASE_URL/api/Address/set-default/99999" `
    -Steps "1. Goi POST /api/Address/set-default/99999" `
    -ExpectedResult "HTTP 404, khong tim thay dia chi" `
    -Headers @{} -Priority "Trung binh"

# TC-050: Get Active Provinces (internal)
Test-Api -TestId "TC-050" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/active-provinces - Lay tinh/TP dang hoat dong (DB noi bo)" `
    -Method "GET" -Url "$BASE_URL/api/Address/active-provinces" `
    -Steps "1. Goi GET /api/Address/active-provinces" `
    -ExpectedResult "HTTP 200, tra ve danh sach tinh/TP co IsActive=true" `
    -Headers @{} -Priority "Trung binh"

# TC-051: Get Active Districts
Test-Api -TestId "TC-051" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/active-districts/1 - Lay quan/huyen dang hoat dong" `
    -Method "GET" -Url "$BASE_URL/api/Address/active-districts/1" `
    -Steps "1. Goi GET /api/Address/active-districts/1" `
    -ExpectedResult "HTTP 200, tra ve danh sach quan/huyen co IsActive=true" `
    -Headers @{} -Priority "Trung binh"

# TC-052: Get Active Wards
Test-Api -TestId "TC-052" -Feature "Dia chi nguoi dung" `
    -Description "GET /api/Address/active-wards/1 - Lay phuong/xa dang hoat dong" `
    -Method "GET" -Url "$BASE_URL/api/Address/active-wards/1" `
    -Steps "1. Goi GET /api/Address/active-wards/1" `
    -ExpectedResult "HTTP 200, tra ve danh sach phuong/xa co IsActive=true" `
    -Headers @{} -Priority "Trung binh"

# ========================================================
# EXPORT TO CSV
# ========================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  XUAT KET QUA RA FILE CSV" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$csvPath = "c:\Users\Thanh\OneDrive\Desktop\FPLOLI\DATN\SRC\V2\LazPe\backend\API_Test_Results.csv"

# Build CSV content with BOM for Excel UTF-8 compatibility
$csvContent = [System.Text.StringBuilder]::new()

# Add BOM
$bom = [char]0xFEFF
[void]$csvContent.Append($bom)

# Header row matching the template
[void]$csvContent.AppendLine("BANG QUAN LY TEST CASE")
[void]$csvContent.AppendLine("STT,Ma Test,Loai Test,Tinh Nang,Mo Ta Test Case,Buoc Thuc Hien,Ket Qua Mong Doi,Ket Qua Thuc Te,Do Uu Tien,Nguoi Thuc Hien,Ngay Thuc Hien,Trang Thai")

foreach ($r in $results) {
    $line = @(
        $r.STT,
        $r."Ma Test",
        $r."Loai Test",
        "`"$($r."Tinh Nang")`"",
        "`"$($r."Mo Ta Test Case" -replace '"','""')`"",
        "`"$($r."Buoc Thuc Hien" -replace '"','""' -replace "`n",' | ')`"",
        "`"$($r."Ket Qua Mong Doi" -replace '"','""')`"",
        "`"$($r."Ket Qua Thuc Te" -replace '"','""')`"",
        $r."Do Uu Tien",
        $r."Nguoi Thuc Hien",
        $r."Ngay Thuc Hien",
        $r."Trang Thai"
    ) -join ","
    [void]$csvContent.AppendLine($line)
}

[System.IO.File]::WriteAllText($csvPath, $csvContent.ToString(), [System.Text.Encoding]::UTF8)

# ========================================================
# SUMMARY
# ========================================================
$passCount = ($results | Where-Object { $_."Trang Thai" -eq "Pass" }).Count
$failCount = ($results | Where-Object { $_."Trang Thai" -eq "Fail" }).Count
$totalCount = $results.Count

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KET QUA TONG HOP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tong so test case: $totalCount" -ForegroundColor White
Write-Host "  Pass: $passCount" -ForegroundColor Green
Write-Host "  Fail: $failCount" -ForegroundColor Red
Write-Host "  Ti le Pass: $([math]::Round(($passCount / $totalCount) * 100, 1))%" -ForegroundColor Yellow
Write-Host "`n  File CSV da duoc luu tai:" -ForegroundColor White
Write-Host "  $csvPath" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
