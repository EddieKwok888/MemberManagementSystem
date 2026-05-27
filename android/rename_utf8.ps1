# Define constants
$oldPackage = "com.vexperthk.membersystem"
$newPackage = "com.vexperthkmembersystem"
$newAppName = "vExperthkMemberSystem"

$androidDir = "C:\GoogleProject\MemeberSystem\android"
$manifestPath = "$androidDir\app\src\main\AndroidManifest.xml"
$gradlePath = "$androidDir\app\build.gradle"
$googleServicesPath = "$androidDir\app\google-services.json"
$srcDir = "$androidDir\app\src\main\java\com\vexperthk\membersystem"
$newSrcDir = "$androidDir\app\src\main\java\com\vexperthkmembersystem"

# 1. Helper function for UTF-8 safe string replacement
function Replace-In-File-Safe {
    param (
        [string]$filePath,
        [string]$search,
        [string]$replace
    )
    if (Test-Path $filePath) {
        # Read as UTF-8 string
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        $newContent = $content.Replace($search, $replace)
        # Write back as UTF-8 (without signature/BOM is standard, but .NET UTF8 handles it perfectly)
        [System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated file: $filePath"
    } else {
        Write-Warning "File not found: $filePath"
    }
}

# 2. Update AndroidManifest.xml
Write-Host "Updating AndroidManifest.xml..."
Replace-In-File-Safe -filePath $manifestPath -search $oldPackage -replace $newPackage
Replace-In-File-Safe -filePath $manifestPath -search 'android:label="Member Management"' -replace "android:label=""$newAppName"""

# 3. Update build.gradle
Write-Host "Updating build.gradle..."
Replace-In-File-Safe -filePath $gradlePath -search $oldPackage -replace $newPackage

# 4. Update google-services.json
Write-Host "Updating google-services.json..."
Replace-In-File-Safe -filePath $googleServicesPath -search $oldPackage -replace $newPackage

# 5. Apply compilation fixes to files BEFORE moving them
Write-Host "Applying compilation fixes..."

# AuthViewModel.kt
Replace-In-File-Safe -filePath "$srcDir\ui\viewmodel\AuthViewModel.kt" -search "getIdTokenResult(true)" -replace "getIdToken(true)"

# DashboardScreen.kt
Replace-In-File-Safe -filePath "$srcDir\ui\screens\DashboardScreen.kt" -search "import androidx.compose.material.icons.filled.Activity" -replace ""
Replace-In-File-Safe -filePath "$srcDir\ui\screens\DashboardScreen.kt" -search "import androidx.compose.material.icons.filled.Users" -replace "import androidx.compose.material.icons.filled.People`r`nimport androidx.compose.material.icons.filled.TrendingUp"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\DashboardScreen.kt" -search "icon = Icons.Default.Users" -replace "icon = Icons.Default.People"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\DashboardScreen.kt" -search "icon = Icons.Default.Activity" -replace "icon = Icons.Default.TrendingUp"

# LoginScreen.kt
Replace-In-File-Safe -filePath "$srcDir\ui\screens\LoginScreen.kt" -search "HorizontalDivider(color = Color(0xFFF1F5F9))" -replace "Divider(color = Color(0xFFF1F5F9))"

# ForgotPasswordScreen.kt
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ForgotPasswordScreen.kt" -search "import androidx.compose.material.icons.filled.ShieldAlert" -replace ""
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ForgotPasswordScreen.kt" -search "imageVector = Icons.Default.ShieldAlert" -replace "imageVector = Icons.Default.Warning"

# EditProfileScreen.kt
Replace-In-File-Safe -filePath "$srcDir\ui\screens\EditProfileScreen.kt" -search "import androidx.compose.material.icons.filled.MapPin" -replace "import androidx.compose.material.icons.filled.Place"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\EditProfileScreen.kt" -search "Icons.Default.MapPin" -replace "Icons.Default.Place"

# ProfileScreen.kt
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ProfileScreen.kt" -search "import androidx.compose.material.icons.filled.MapPin" -replace "import androidx.compose.material.icons.filled.Place"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ProfileScreen.kt" -search "import androidx.compose.material3.*" -replace "import androidx.compose.material3.*`r`nimport androidx.compose.ui.text.style.TextAlign"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ProfileScreen.kt" -search "icon = Icons.Default.MapPin" -replace "icon = Icons.Default.Place"
Replace-In-File-Safe -filePath "$srcDir\ui\screens\ProfileScreen.kt" -search "HorizontalDivider(color = Color(0xFFF1F5F9))" -replace "Divider(color = Color(0xFFF1F5F9))"

# 6. Global package name rename across ALL Kotlin source files recursively
Write-Host "Updating Kotlin package declarations and imports..."
$ktFiles = Get-ChildItem -Path $srcDir -Filter "*.kt" -Recurse
foreach ($file in $ktFiles) {
    Replace-In-File-Safe -filePath $file.FullName -search $oldPackage -replace $newPackage
}

# 7. Restructure directories
Write-Host "Creating new source directory: $newSrcDir..."
if (!(Test-Path $newSrcDir)) {
    New-Item -ItemType Directory -Force -Path $newSrcDir | Out-Null
}

Write-Host "Moving source files to new package folder..."
Get-ChildItem -Path $srcDir | ForEach-Object {
    $dest = Join-Path $newSrcDir $_.Name
    Move-Item -Path $_.FullName -Destination $dest -Force
}

# 8. Clean up old directory structure
Write-Host "Cleaning up old directory structures..."
$oldVexperthkDir = "$androidDir\app\src\main\java\com\vexperthk"
if (Test-Path $oldVexperthkDir) {
    Remove-Item -Path $oldVexperthkDir -Recurse -Force
}

Write-Host "Package and App Name successfully renamed with strict UTF-8!"
