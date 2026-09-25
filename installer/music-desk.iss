#ifndef AppVersion
  #define AppVersion "0.2.0"
#endif
#ifndef SourceDir
  #define SourceDir "..\release\installer\win-unpacked"
#endif

[Setup]
AppId=local.musicdesk.desktop
AppName=Music Desk
AppVersion={#AppVersion}
AppPublisher=Aenco5523
AppPublisherURL=https://github.com/Aenco5523/discord-music-desk
DefaultDirName={localappdata}\Programs\Music Desk
DefaultGroupName=Music Desk
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=..\release\installer
OutputBaseFilename=Music-Desk-{#AppVersion}-Setup
SetupIconFile=..\build\icon.ico
UninstallDisplayIcon={app}\Music Desk.exe
LicenseFile=..\LICENSE
WizardStyle=modern
ShowLanguageDialog=yes
LanguageDetectionMethod=uilanguage
Compression=lzma2
SolidCompression=yes

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "chinesesimplified"; MessagesFile: "languages\ChineseSimplified.isl"
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "INNO-LICENSE.txt"; DestDir: "{app}\licenses"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Music Desk"; Filename: "{app}\Music Desk.exe"; Parameters: "--initial-lang={language}"

[Run]
Filename: "{app}\Music Desk.exe"; Parameters: "--initial-lang={language}"; Description: "{cm:LaunchProgram,Music Desk}"; Flags: nowait postinstall skipifsilent
