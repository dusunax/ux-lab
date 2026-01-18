package com.onemoondate;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class LanguageStorageModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "LanguageStorage";
    private static final String PREFS_NAME = "com.onemoondate.preferences";
    private static final String KEY_LANGUAGE = "language";
    private static final String KEY_DARK_MODE = "darkMode";

    public LanguageStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void setLanguage(String language, Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_LANGUAGE, language).apply();
            
            android.content.Intent intent = new android.content.Intent(
                getReactApplicationContext(),
                com.onemoondate.widget.LunarWidgetProvider.class
            );
            intent.setAction("com.onemoondate.ACTION_UPDATE_WIDGET");
            getReactApplicationContext().sendBroadcast(intent);
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SET_LANGUAGE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setDarkMode(boolean isDark, Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_DARK_MODE, isDark).apply();
            
            android.content.Intent intent = new android.content.Intent(
                getReactApplicationContext(),
                com.onemoondate.widget.LunarWidgetProvider.class
            );
            intent.setAction("com.onemoondate.ACTION_UPDATE_WIDGET");
            getReactApplicationContext().sendBroadcast(intent);
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SET_DARK_MODE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getLanguage(Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String language = prefs.getString(KEY_LANGUAGE, "ko");
            promise.resolve(language);
        } catch (Exception e) {
            promise.reject("GET_LANGUAGE_ERROR", e.getMessage());
        }
    }
}
