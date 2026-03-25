; ============================================
; TimiGS - Modern NSIS Installer Script
; Beautiful UI with custom colors and design
; ============================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "StrFunc.nsh"

${StrCase}

; ============================================
; Basic Settings
; ============================================
!define APP_NAME "TimiGS"
!define APP_EXECUTABLE "TimiGS.exe"
!define APP_REGISTRY_KEY "Software\Microsoft\Windows\CurrentVersion\Run\TimiGS"
!define APP_DATA_FOLDER "com.timigs.app"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

Name "${APP_NAME}"
OutFile "TimiGS_${VERSION}_Installer.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "${UNINSTALL_KEY}" "InstallLocation"

RequestExecutionLevel admin

; ============================================
; Modern UI Configuration
; ============================================
!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING
!define MUI_ICON "icons\icon.ico"
!define MUI_UNICON "icons\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "windows\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "windows\installer-finish.bmp"

; Custom Colors - Modern Blue Theme
!define MUI_BGCOLOR "002D5C"
!define MUI_TEXTCOLOR "FFFFFF"
!define MUI_WELCOMEPAGE_BGCOLOR "002D5C"
!define MUI_WELCOMEPAGE_TEXTCOLOR "FFFFFF"
!define MUI_FINISHPAGE_BGCOLOR "002D5C"
!define MUI_FINISHPAGE_TEXTCOLOR "FFFFFF"

; ============================================
; Pages
; ============================================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ============================================
; Languages
; ============================================
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Ukrainian"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "Arabic"

; Language Strings
LangString DESC_SecMain ${LANG_ENGLISH} "Main application files"
LangString DESC_SecMain ${LANG_UKRAINIAN} "Основні файли програми"
LangString DESC_SecMain ${LANG_GERMAN} "Hauptanwendungsdateien"
LangString DESC_SecMain ${LANG_FRENCH} "Fichiers principaux de l'application"
LangString DESC_SecMain ${LANG_SIMPCHINESE} "主应用程序文件"
LangString DESC_SecMain ${LANG_ARABIC} "ملفات التطبيق الرئيسية"

LangString DESC_SecStart ${LANG_ENGLISH} "Start with Windows"
LangString DESC_SecStart ${LANG_UKRAINIAN} "Запускати з Windows"
LangString DESC_SecStart ${LANG_GERMAN} "Mit Windows starten"
LangString DESC_SecStart ${LANG_FRENCH} "Démarrer avec Windows"
LangString DESC_SecStart ${LANG_SIMPCHINESE} "随 Windows 启动"
LangString DESC_SecStart ${LANG_ARABIC} "البدء مع Windows"

LangString DESC_SecDesk ${LANG_ENGLISH} "Create desktop shortcut"
LangString DESC_SecDesk ${LANG_UKRAINIAN} "Створити ярлик на робочому столі"
LangString DESC_SecDesk ${LANG_GERMAN} "Desktop-Verknüpfung erstellen"
LangString DESC_SecDesk ${LANG_FRENCH} "Créer un raccourci bureau"
LangString DESC_SecDesk ${LANG_SIMPCHINESE} "创建桌面快捷方式"
LangString DESC_SecDesk ${LANG_ARABIC} "إنشاء اختصار سطح المكتب"

; Custom UI Text
LangString TEXT_Welcome ${LANG_ENGLISH} "Welcome to ${APP_NAME} Setup"
LangString TEXT_Welcome ${LANG_UKRAINIAN} "Ласкаво просимо до встановлення ${APP_NAME}"
LangString TEXT_Welcome ${LANG_GERMAN} "Willkommen bei ${APP_NAME} Setup"
LangString TEXT_Welcome ${LANG_FRENCH} "Bienvenue dans l'installation de ${APP_NAME}"
LangString TEXT_Welcome ${LANG_SIMPCHINESE} "欢迎使用 ${APP_NAME} 安装程序"
LangString TEXT_Welcome ${LANG_ARABIC} "مرحبًا بك في إعداد ${APP_NAME}"

LangString TEXT_Finish ${LANG_ENGLISH} "${APP_NAME} has been successfully installed!"
LangString TEXT_Finish ${LANG_UKRAINIAN} "${APP_NAME} успішно встановлено!"
LangString TEXT_Finish ${LANG_GERMAN} "${APP_NAME} wurde erfolgreich installiert!"
LangString TEXT_Finish ${LANG_FRENCH} "${APP_NAME} a été installé avec succès!"
LangString TEXT_Finish ${LANG_SIMPCHINESE} "${APP_NAME} 已成功安装！"
LangString TEXT_Finish ${LANG_ARABIC} "تم تثبيت ${APP_NAME} بنجاح!"

; ============================================
; Variables
; ============================================
Var StartWithWindows 0
Var CreateDesktopShortcut 1
Var Dialog
Var Checkbox_Start
Var Checkbox_Desktop

; ============================================
; Custom Welcome Page
; ============================================
!define MUI_PAGE_CUSTOMFUNCTION_PRE WelcomePre
Function WelcomePre
  !insertmacro MUI_HEADER_TEXT "$(TEXT_Welcome)" "Activity Tracker for Windows"
FunctionEnd

; ============================================
; Custom Components Page
; ============================================
Page custom ComponentsPage ComponentsLeave

Function ComponentsPage
  nsDialogs::Create 1018
  Pop $Dialog

  ${NSD_CreateLabel} 0 0 100% 12u "Select additional options:"
  Pop $R0

  ; Start with Windows checkbox
  ${NSD_CreateCheckbox} 20u 20u 100% 10u "$(DESC_SecStart)"
  Pop $Checkbox_Start
  SendMessage $Checkbox_Start ${BM_SETCHECK} ${BST_UNCHECKED} 0

  ; Desktop shortcut checkbox
  ${NSD_CreateCheckbox} 20u 40u 100% 10u "$(DESC_SecDesk)"
  Pop $Checkbox_Desktop
  SendMessage $Checkbox_Desktop ${BM_SETCHECK} ${BST_CHECKED} 0

  nsDialogs::Show
FunctionEnd

Function ComponentsLeave
  ${NSD_GetState} $Checkbox_Start $StartWithWindows
  ${NSD_GetState} $Checkbox_Desktop $CreateDesktopShortcut
FunctionEnd

; ============================================
; Installation Sections
; ============================================
Section "Main Application" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Install main files
  File /r "${BUILD_DIR}\*.*"
  
  ; Set as default application for protocol (if applicable)
  ; Add file association if needed
  
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Create uninstall registry entry
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "Publisher" "Baneronetwo"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoRepair" 1
  
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0
  CreateShortCut "$SMPROGRAMS\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0
SectionEnd

Section "Start Menu" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
SectionEnd

; ============================================
; Autostart Configuration
; ============================================
Section "Autostart" SecAutostart
  ${If} $StartWithWindows == 1
    ; Add to Windows startup registry
    WriteRegStr HKCU "${APP_REGISTRY_KEY}" "" "$INSTDIR\${APP_EXECUTABLE}"
    
    ; Also create shortcut in Startup folder as backup
    CreateShortCut "$SMSTARTUP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0
  ${EndIf}
SectionEnd

; ============================================
; Post-Install Actions
; ============================================
Section -PostInstall
  ; Store installation directory
  WriteRegStr HKLM "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  
  ; Launch application option
  ExecShell "open" "$INSTDIR\${APP_EXECUTABLE}"
SectionEnd

; ============================================
; Descriptions
; ============================================
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "$(DESC_SecMain)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "$(DESC_SecDesk)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAutostart} "$(DESC_SecStart)"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ============================================
; Uninstaller Sections
; ============================================
Section "Uninstall"
  ; Remove registry keys
  DeleteRegKey HKLM "${UNINSTALL_KEY}"
  DeleteRegValue HKCU "${APP_REGISTRY_KEY}" ""
  
  ; Remove shortcuts
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk"
  Delete "$SMSTARTUP\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Optional: Remove app data
  MessageBox MB_YESNO|MB_ICONQUESTION "Would you like to remove all ${APP_NAME} data (activity history, settings)?" IDNO skip_cleanup
    RMDir /r "$LOCALAPPDATA\${APP_DATA_FOLDER}"
    RMDir /r "$APPDATA\${APP_DATA_FOLDER}"
  skip_cleanup:
  
SectionEnd

; ============================================
; Custom Styles via Modern UI
; ============================================
!define MUI_HEADER_TRANSPARENT_TEXT
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "$(TEXT_Finish)"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME} now"
