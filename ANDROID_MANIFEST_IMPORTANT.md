# IMPORTANT: AndroidManifest.xml Facebook Configuration

## Problem
The `AndroidManifest.xml` file contains critical Facebook SDK configuration that gets **OVERWRITTEN** when running `npx cap sync android`.

## Solution
**DO NOT RUN** `npx cap sync android` after the initial setup.

Instead, use these commands:
```bash
# Build the Angular app
npm run build

# Copy web assets only (preserves AndroidManifest.xml)
npx cap copy android
```

## Facebook SDK Configuration (Required)
The following entries in `android/app/src/main/AndroidManifest.xml` are REQUIRED for Facebook Login to work:

```xml
<!-- Inside <application> tag, before closing </application> -->

<!-- Facebook SDK Configuration -->
<meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
<meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token"/>

<activity android:name="com.facebook.FacebookActivity"
    android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
    android:label="@string/app_name" />

<activity android:name="com.facebook.CustomTabActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="@string/fb_login_protocol_scheme" />
    </intent-filter>
</activity>
```

## If Configuration Gets Lost
If you accidentally run `npx cap sync` and the configuration is lost, manually re-add the Facebook SDK configuration above to the AndroidManifest.xml file.
