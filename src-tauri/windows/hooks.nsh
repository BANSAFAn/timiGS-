; TimiGS NSIS Installer Hooks
; These macros are called at specific points during install/uninstall.
; Note: Autostart is now managed by tauri-plugin-autostart at runtime.
; These hooks only handle initial startup preference during installation.

!macro NSIS_HOOK_POSTINSTALL
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0

  ; Ask to add to startup (initial preference only - app manages this going forward)
  MessageBox MB_YESNO|MB_ICONQUESTION "Would you like TimiGS to start automatically with Windows?" IDNO skip_autostart
    ; Set initial autostart preference in app data for first launch
    ; The app will read this on first run and configure autostart via the plugin
    CreateDirectory "$APPDATA\com.timigs.app"
    WriteIniStr "$APPDATA\com.timigs.app\first_run.ini" "Settings" "Autostart" "true"
  skip_autostart:
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Remove desktop shortcut
  Delete "$DESKTOP\TimiGS.lnk"

  ; Note: Autostart registry entries are managed by tauri-plugin-autostart
  ; and will be cleaned up automatically when the app is uninstalled
  ; or when user disables autostart in settings

  ; Ask about removing app data
  MessageBox MB_YESNO|MB_ICONQUESTION "Would you like to remove all TimiGS data (activity history, settings)?" IDNO skip_cleanup
    RMDir /r "$LOCALAPPDATA\com.timigs.app"
    RMDir /r "$APPDATA\com.timigs.app"
  skip_cleanup:
!macroend
