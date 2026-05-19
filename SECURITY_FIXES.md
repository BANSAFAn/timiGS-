# Security Fixes - v1.5.0

## Fixed Issues

### 1. Autostart Problem
- **Problem**: Application failed to load frontend when started with `--minimized` flag (autostart)
- **Cause**: 5-second delay before Tauri initialization prevented WebView from loading
- **Fix**: Moved delay to after window creation, reduced to 800ms, window hides after WebView loads

### 2. P2P Server Security Vulnerabilities

#### Path Traversal Attack
- **Risk**: Attackers could write files outside download directory using `../` in filename
- **Fix**: Added filename sanitization and path validation

#### File Upload Limit
- **Risk**: No size limit allowed DoS attacks with large files
- **Fix**: Added 100MB file size limit

#### Rate Limiting
- **Risk**: No protection against spam/DoS attacks
- **Fix**: Added rate limiter (10 requests per 60 seconds per IP)

#### Network Exposure
- **Risk**: Server listened on 0.0.0.0:4444 (all interfaces)
- **Fix**: Changed to 127.0.0.1:4444 (localhost only)

#### CORS Policy
- **Risk**: Open CORS policy (`*`) allowed any origin
- **Fix**: Restricted to `http://localhost`

### 3. IP Validation
- **Risk**: Commands accepted any IP address without validation
- **Fix**: Added validation to only allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x)

### 4. Request Timeouts
- **Risk**: No timeout on HTTP requests could hang application
- **Fix**: Added 5-second timeout for connections, 30-second for file transfers

## Database Security
- All SQL queries use parameterized statements (no SQL injection risk)
- Database stored in user's local AppData directory with proper permissions

## Build Verification
- Added frontend build check to prevent shipping empty dist folder
- Installer now verifies all required files are present

## Recommendations for Users
1. Update to latest version immediately
2. If using P2P features, ensure firewall is configured properly
3. Only connect to trusted devices on local network
4. Keep Windows Defender/antivirus enabled
