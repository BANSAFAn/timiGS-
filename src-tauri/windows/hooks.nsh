!define MUI_BGCOLOR "0A0A12"
!define MUI_TEXTCOLOR "E8E8F0"
!define MUI_LICENSEPAGE_BGCOLOR "0E0E1A"
!define MUI_DIRECTORYPAGE_BGCOLOR "0E0E1A"
!define MUI_WELCOMEPAGE_BGCOLOR "060609"
!define MUI_WELCOMEPAGE_TEXTCOLOR "E8E8F0"
!define MUI_FINISHPAGE_BGCOLOR "060609"
!define MUI_FINISHPAGE_TEXTCOLOR "E8E8F0"
!define MUI_INSTFILESPAGE_COLORS "E8E8F0 0E0E1A"
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"

!define APP_REGISTRY_KEY "Software\Microsoft\Windows\CurrentVersion\Run\TimiGS"
!define APP_DATA_FOLDER "com.timigs.app"

!macro NSIS_HOOK_POSTINSTALL
  CreateShortCut "$DESKTOP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0 SW_SHOWNORMAL "$INSTDIR"
  
  CreateDirectory "$SMPROGRAMS\TimiGS"
  CreateShortCut "$SMPROGRAMS\TimiGS\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "" "$INSTDIR\TimiGS.exe" 0 SW_SHOWNORMAL "$INSTDIR"
  CreateShortCut "$SMPROGRAMS\TimiGS\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0 SW_SHOWNORMAL "$INSTDIR"
  
  MessageBox MB_YESNO|MB_ICONQUESTION|MB_TOPMOST "Would you like TimiGS to start automatically when Windows starts?$\r$\n$\r$\nYou can change this later in settings." IDNO NoAutostart
    WriteRegStr HKCU "${APP_REGISTRY_KEY}" "" "$\"$INSTDIR\TimiGS.exe$\" --minimized"
    CreateShortCut "$SMSTARTUP\TimiGS.lnk" "$INSTDIR\TimiGS.exe" "--minimized" "$INSTDIR\TimiGS.exe" 0 SW_SHOWMINIMIZED "$INSTDIR"
  NoAutostart:
  
  CreateDirectory "$APPDATA\com.timigs.app"
  WriteIniStr "$APPDATA\com.timigs.app\install_info.ini" "Install" "Path" "$INSTDIR"
  WriteIniStr "$APPDATA\com.timigs.app\install_info.ini" "Install" "Date" "$(^Date)"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$DESKTOP\TimiGS.lnk"
  Delete "$SMPROGRAMS\TimiGS\TimiGS.lnk"
  Delete "$SMPROGRAMS\TimiGS\Uninstall.lnk"
  Delete "$SMSTARTUP\TimiGS.lnk"
  RMDir "$SMPROGRAMS\TimiGS"
  
  DeleteRegValue HKCU "${APP_REGISTRY_KEY}" ""
  DeleteRegValue HKLM "${APP_REGISTRY_KEY}" ""
  
  Delete "$SMSTARTUP\TimiGS.lnk"
  
  MessageBox MB_YESNO|MB_ICONQUESTION|MB_TOPMOST "Remove all TimiGS data?$\r$\n$\r$\nIncludes activity history, settings, and cached data." IDNO KeepData
  
  RMDir /r "$LOCALAPPDATA\com.timigs.app"
  RMDir /r "$APPDATA\com.timigs.app"
  
  KeepData:
    Delete "$APPDATA\com.timigs.app\install_info.ini"
!macroend