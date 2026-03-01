; TimiGS NSIS Installer Hooks
; These macros are called at specific points during install/uninstall.

!macro NSIS_HOOK_POSTINSTALL
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0

  ; Ask to add to startup
  MessageBox MB_YESNO|MB_ICONQUESTION "Would you like TimiGS to start automatically with Windows?" IDNO skip_autostart
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TimiGS" '"$INSTDIR\TimiGS.exe" --minimized'
  skip_autostart:
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Remove desktop shortcut
  Delete "$DESKTOP\TimiGS.lnk"

  ; Remove autostart registry entry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TimiGS"

  ; Ask about removing app data
  MessageBox MB_YESNO|MB_ICONQUESTION "Would you like to remove all TimiGS data (activity history, settings)?" IDNO skip_cleanup
    RMDir /r "$LOCALAPPDATA\com.timigs.app"
    RMDir /r "$APPDATA\com.timigs.app"
  skip_cleanup:
!macroend
