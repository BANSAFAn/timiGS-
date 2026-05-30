!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "StrFunc.nsh"

${StrCase}

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

!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING
!define MUI_ICON "icons\icon.ico"
!define MUI_UNICON "icons\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "windows\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "windows\installer-finish.bmp"



!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
Page custom ComponentsPage ComponentsLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Ukrainian"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "Arabic"

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

Var StartWithWindows
Var CreateDesktopShortcut
Var Dialog
Var Checkbox_Start
Var Checkbox_Desktop

!define MUI_PAGE_CUSTOMFUNCTION_PRE WelcomePre
Function WelcomePre
  !insertmacro MUI_HEADER_TEXT "$(TEXT_Welcome)" "Privacy-First Activity Tracker"
FunctionEnd

Function ComponentsPage
  nsDialogs::Create 1018
  Pop $Dialog

  ${NSD_CreateLabel} 0 0 100% 24u "Configure ${APP_NAME} installation options:"
  Pop $R0

  ${NSD_CreateCheckbox} 20u 35u 100% 12u "$(DESC_SecDesk)"
  Pop $Checkbox_Desktop
  SendMessage $Checkbox_Desktop ${BM_SETCHECK} ${BST_CHECKED} 0

  ${NSD_CreateCheckbox} 20u 55u 100% 12u "$(DESC_SecStart)"
  Pop $Checkbox_Start
  SendMessage $Checkbox_Start ${BM_SETCHECK} ${BST_UNCHECKED} 0

  ${NSD_CreateLabel} 20u 75u 100% 32u "Note: You can change these settings later in the application."
  Pop $R1
  SetCtlColors $R1 0x666666 ""

  nsDialogs::Show
FunctionEnd

Function ComponentsLeave
  ${NSD_GetState} $Checkbox_Start $StartWithWindows
  ${NSD_GetState} $Checkbox_Desktop $CreateDesktopShortcut
FunctionEnd

Section "Main Application" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  File /r "${BUILD_DIR}\*.*"
  
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
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
  ${If} $CreateDesktopShortcut == 1
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0 SW_SHOWNORMAL "$INSTDIR"
  ${EndIf}
SectionEnd

Section "Start Menu" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "" "$INSTDIR\${APP_EXECUTABLE}" 0 SW_SHOWNORMAL "$INSTDIR"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0 SW_SHOWNORMAL "$INSTDIR"
SectionEnd

Section "Autostart" SecAutostart
  ${If} $StartWithWindows == 1
    WriteRegStr HKCU "${APP_REGISTRY_KEY}" "" "$\"$INSTDIR\${APP_EXECUTABLE}$\" --minimized"
    CreateShortCut "$SMSTARTUP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE}" "--minimized" "$INSTDIR\${APP_EXECUTABLE}" 0 SW_SHOWMINIMIZED "$INSTDIR"
  ${EndIf}
SectionEnd

Section -PostInstall
  WriteRegStr HKLM "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "$(DESC_SecMain)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "$(DESC_SecDesk)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAutostart} "$(DESC_SecStart)"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
  DeleteRegKey HKLM "${UNINSTALL_KEY}"
  DeleteRegValue HKCU "${APP_REGISTRY_KEY}" ""
  
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk"
  Delete "$SMSTARTUP\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  
  RMDir /r "$INSTDIR"
  
  MessageBox MB_YESNO|MB_ICONQUESTION "Remove all ${APP_NAME} data (activity history, settings)?" IDNO skip_cleanup
    RMDir /r "$LOCALAPPDATA\${APP_DATA_FOLDER}"
    RMDir /r "$APPDATA\${APP_DATA_FOLDER}"
  skip_cleanup:
  
SectionEnd

!define MUI_HEADER_TRANSPARENT_TEXT
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "$(TEXT_Finish)"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME} now"
