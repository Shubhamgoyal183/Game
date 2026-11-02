# Game Zone — Android App

Website (`index.html`, `games/`, `css/`, `js/`, `icons/`) hi app ke andar jaati hai. Ye folder sirf Android build ke liye hai (Capacitor 6).

## APK banana

```
cd app
npm install        # sirf pehli baar
npm run apk        # → ../download/GameZone.apk
```

Zaroori: Java 17, Android SDK (platform 34, build-tools 34). Website mein kuch bhi badlo, phir `npm run apk` dobara chalao.

Har nayi release se pehle `android/app/build.gradle` mein `versionCode` +1 karo (aur `versionName` badlo), warna phone par update install nahi hoga.

## Signing key (bahut zaroori)

- `android/keystore/gamezone-release.jks` aur `android/keystore.properties` mein app ki signing key aur password hain.
- Ye GitHub par nahi jaate (`.gitignore`). **Inka backup kahin safe rakho** (Google Drive / pen drive).
- Key kho gayi toh purane users ko update nahi de paoge — unhe app uninstall karke dobara install karni padegi.

## Firebase (Login + Cloud save) setup

1. https://console.firebase.google.com → **Add project** (naam: Game Zone).
2. **Build → Authentication → Get started** → Sign-in method mein **Email/Password** aur **Google** chalu karo.
3. **Build → Firestore Database → Create database** (production mode) → **Rules** tab mein `firebase/firestore.rules` ka text paste karke Publish.
4. **Project settings → General → Your apps → Web (</>)** app add karo → jo `firebaseConfig` mile, uski values `../js/firebase-config.js` mein bharo.
5. Usi page par **Android** app add karo:
   - Package name: `com.shubhamgoyal.gamezone`
   - SHA-1 (release key): `42:11:69:EE:DF:A5:67:43:15:95:57:74:F4:D2:FB:20:07:D7:8F:54`
   - SHA-256 bhi add karo: `EB:73:B0:54:AB:BF:F2:9B:AD:DE:F0:3A:2D:DE:26:41:7C:7B:15:66:5F:34:72:56:63:A1:0C:47:B1:B6:94:EC`
   - `google-services.json` download karke `android/app/google-services.json` par rakho.
6. Website par Google login ke liye: **Authentication → Settings → Authorized domains** mein apni website ka domain jodo.
7. `npm run apk` — ab Email aur Google dono login chalenge.

`google-services.json` na ho toh app Email login ke saath chalti hai; Google button "setup baaki hai" dikhata hai (crash nahi hota).
