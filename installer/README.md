# Unified Windows installer

`music-desk.iss` produces one Setup EXE with Korean, Simplified Chinese, Japanese and English choices. It uses the app directory created by electron-builder and passes the selected installer language on first launch and through the Start Menu shortcut. The app's saved language takes priority on later launches.

Build on Windows x64 with Inno Setup 6.4.1 or newer:

```powershell
pnpm package:installer
```

The script detects common `ISCC.exe` locations. Set `INNO_SETUP_ISCC` to the compiler's full path if detection fails. The result is `release/installer/Music-Desk-<version>-Setup.exe`.

`languages/ChineseSimplified.isl` is the community translation shipped by the [Inno Setup source repository at tag `is-6_4_1`](https://github.com/jrsoftware/issrc/blob/is-6_4_1/Files/Languages/Unofficial/ChineseSimplified.isl). The Korean and Japanese translations and English defaults come from the installed Inno Setup compiler. `INNO-LICENSE.txt` is the corresponding Inno Setup license; it is included in the installed application's `licenses` folder.
