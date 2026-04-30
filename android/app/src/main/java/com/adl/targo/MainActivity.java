package com.adl.targo;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WifiManager.WifiLock wifiLock;
    private WifiManager.MulticastLock multicastLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UdpSocketPlugin.class);
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);

        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_LOW_LATENCY, "targo:wifilock");
                multicastLock = wifiManager.createMulticastLock("targo:multicastlock");
                multicastLock.setReferenceCounted(true);
                multicastLock.acquire();
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Lock setup failed: " + e.getClass().getName() + ": " + e.getMessage());
            wifiLock = null;
            multicastLock = null;
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            if (wifiLock != null && !wifiLock.isHeld()) {
                wifiLock.acquire();
            }
            if (multicastLock != null && !multicastLock.isHeld()) {
                multicastLock.acquire();
            }
        } catch (Exception e) {
            // not supported on this device
        }
    }

    @Override
    public void onPause() {
        try {
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
            }
            if (multicastLock != null && multicastLock.isHeld()) {
                multicastLock.release();
            }
        } catch (Exception e) {
            // ignore
        }
        super.onPause();
    }
}
