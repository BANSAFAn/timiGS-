; ============================================
; TimiGS NSIS Installer Hooks
; Enhanced with proper Windows autostart functionality
; ============================================

!define APP_REGISTRY_KEY "Software\Microsoft\Windows\CurrentVersion\Run\TimiGS"
!define APP_DATA_FOLDER "com.timigs.app"

; ============================================
; Post-Install Hook
; ============================================
!macro NSIS_HOOK_POSTINSTALL
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0
  
  ; Create Start Menu folder and shortcuts
  CreateDirectory "$SMPROGRAMS\TimiGS"
  CreateShortCut "$SMPROGRAMS\TimiGS\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0
  CreateShortCut "$SMPROGRAMS\TimiGS\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
  
  ; Check if user wants autostart (read from installer variable if available)
  ; Default: Ask user with a nice dialog
  Var /GLOBAL AutostartChoice
  
  ; Read autostart preference if set by custom installer page
  ${If} ${FileExists} "$APPDATA\com.timigs.app\install_options.ini"
    ReadIniStr $AutostartChoice "$APPDATA\com.timigs.app\install_options.ini" "Install" "Autostart"
  ${Else}
    ; Show autostart dialog
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_TOPMOST "Would you like TimiGS to start automatically when Windows starts?$\r$\n$\r$\nYou can always change this later in the application settings." IDNO NoAutostart
      StrCpy $AutostartChoice "yes"
      Goto DoAutostart
    NoAutostart:
      StrCpy $AutostartChoice "no"
    DoAutostart:
  ${EndIf}
  
  ; Configure autostart if requested
  ${If} $AutostartChoice == "yes"
    Call EnableAutostart
  ${EndIf}
  
  ; Store installation info for the application
  CreateDirectory "$APPDATA\com.timigs.app"
  WriteIniStr "$APPDATA\com.timigs.app\install_info.ini" "Install" "Path" "$INSTDIR"
  WriteIniStr "$APPDATA\com.timigs.app\install_info.ini" "Install" "Date" "$(^Date)"
!macroend

; ============================================
; Pre-Uninstall Hook
; ============================================
!macro NSIS_HOOK_PREUNINSTALL
  ; Remove all shortcuts
  Delete "$DESKTOP\TimiGS.lnk"
  Delete "$SMPROGRAMS\TimiGS\TimiGS.lnk"
  Delete "$SMPROGRAMS\TimiGS\Uninstall.lnk"
  Delete "$SMSTARTUP\TimiGS.lnk"
  RMDir "$SMPROGRAMS\TimiGS"
  
  ; Clean up autostart registry entries (both HKCU and HKLM)
  DeleteRegValue HKCU "${APP_REGISTRY_KEY}" ""
  DeleteRegValue HKLM "${APP_REGISTRY_KEY}" ""
  
  ; Remove any leftover startup shortcuts
  Delete "$SMSTARTUP\TimiGS.lnk"
  
  ; Ask about removing app data
  MessageBox MB_YESNO|MB_ICONQUESTION|MB_TOPMOST "Would you like to remove all TimiGS data?$\r$\n$\r$\nThis includes:$\r$\n- Activity history$\r$\n- Settings$\r$\n- Cached data" IDNO KeepData
  
  ; Remove local app data
  RMDir /r "$LOCALAPPDATA\com.timigs.app"
  
  ; Remove roaming app data
  RMDir /r "$APPDATA\com.timigs.app"
  
  KeepData:
    ; Just remove install info, keep activity data
    Delete "$APPDATA\com.timigs.app\install_info.ini"
!macroend

; ============================================
; Autostart Functions
; ============================================
Function EnableAutostart
  ; Method 1: Registry key (most reliable)
  WriteRegStr HKCU "${APP_REGISTRY_KEY}" "" "$INSTDIR\TimiGS.exe"
  
  ; Method 2: Also create shortcut in Startup folder as backup
  ; This ensures autostart works even if one method fails
  CreateShortCut "$SMSTARTUP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0
  
  ; Set minimized flag if user wants it to start in tray
  ; This can be configured via CLI argument
FunctionEnd

Function DisableAutostart
  ; Remove registry entry
  DeleteRegValue HKCU "${APP_REGISTRY_KEY}" ""
  DeleteRegValue HKLM "${APP_REGISTRY_KEY}" ""
  
  ; Remove startup folder shortcut
  Delete "$SMSTARTUP\TimiGS.lnk"
FunctionEnd
