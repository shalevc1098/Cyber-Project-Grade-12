package com.mobile;

import android.app.Application;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Build;
import android.os.Environment;
import android.os.FileObserver;
import android.provider.Settings;
import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.rnfs.RNFSPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import android.content.Intent;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.documentfile.provider.DocumentFile;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;

import com.facebook.react.bridge.Promise;

import org.devio.rn.splashscreen.SplashScreenReactPackage;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            @SuppressWarnings("UnnecessaryLocalVariable")
            List<ReactPackage> packages = new PackageList(this).getPackages();
            packages.add(new ManageStorageReactPackage());
            packages.add(new AndroidFsReactPackage());
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "packages/mobile/index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
        sharedI18nUtilInstance.allowRTL(getApplicationContext(), false);
        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method
     * with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
                /*
                 * We use reflection here to pick up the class that initializes Flipper,
                 * since Flipper library is not available in release mode
                 */
                Class<?> aClass = Class.forName("com.mobile.ReactNativeFlipper");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }
}

class ManageStorageModule extends ReactContextBaseJavaModule {

    ReactApplicationContext context = getReactApplicationContext();

    ManageStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ManageStorage";
    }

    @RequiresApi(api = Build.VERSION_CODES.R)
    @ReactMethod
    void RequestPermission() {
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Uri uri = Uri.fromParts("package", context.getPackageName(), null);
        intent.setData(uri);
        context.startActivity(intent);
    }

    @RequiresApi(api = Build.VERSION_CODES.R)
    @ReactMethod
    void isExternalStorageManager(Promise promise) {
        promise.resolve(Environment.isExternalStorageManager());
    }
}

class ManageStorageReactPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ManageStorageModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}

class AndroidFsModule extends ReactContextBaseJavaModule {

    ReactApplicationContext context = getReactApplicationContext();
    HashMap<String, BufferedInputStream> readStreams = new HashMap<>();
    HashMap<String, BufferedOutputStream> writeStreams = new HashMap<>();
    HashMap<String, FileObserver> watchers = new HashMap<>();

    AndroidFsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AndroidFs";
    }

    private void sendEvent(String eventName, Object data) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, data);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Set up any upstream listeners or background tasks as necessary
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Remove upstream listeners, stop unnecessary background tasks
    }

    @ReactMethod
    void readChunk(String streamId, String path, int bufferSize) {
        new Thread(() -> {
            try {
                BufferedInputStream inputStream;
                if (readStreams.containsKey(streamId)) {
                    inputStream = readStreams.get(streamId);
                } else {
                    inputStream = new BufferedInputStream(new FileInputStream(path));
                    readStreams.put(streamId, inputStream);
                }
                byte[] buffer = new byte[bufferSize];
                int cursor = inputStream.read(buffer);
                if (cursor != -1) {
                    if (cursor < bufferSize) {
                        byte[] bufferCopy = new byte[cursor];
                        for (int i = 0; i < bufferCopy.length; i++) {
                            bufferCopy[i] = buffer[i];
                        }
                        String chunk = Base64.encodeToString(bufferCopy, Base64.NO_WRAP);
                        sendEvent(streamId + "data", chunk);
                        sendEvent(streamId + "end", null);
                    } else {
                        String chunk = Base64.encodeToString(buffer, Base64.NO_WRAP);
                        sendEvent(streamId + "data", chunk);
                    }
                    Log.d("Cursor", "Cursor is " + cursor);
                }
            } catch(Exception exception) {
                exception.printStackTrace();
            }
        }).start();
    }

    @ReactMethod
    void destroyReadStream(String streamId) throws IOException {
        if (!readStreams.containsKey(streamId)) return;
        InputStream inputStream = readStreams.get(streamId);
        inputStream.close();
        readStreams.remove(streamId);
        sendEvent(streamId + "close", null);
    }

    @ReactMethod
    void writeChunk(String streamId, String path, String chunk) {
        new Thread(() -> {
            try {
                File file = new File(path);
                File directory = file.getAbsoluteFile().getParentFile().getParentFile();
                if (directory == null) throw new Error("Directory not found!\n" + path);
                BufferedOutputStream outputStream;
                if (writeStreams.containsKey(streamId)) {
                    outputStream = writeStreams.get(streamId);
                    // if needed add check here to check if the stream is closed
                } else {
                    outputStream = new BufferedOutputStream(new FileOutputStream(path));
                    writeStreams.put(streamId, outputStream);
                }
                byte[] buffer = Base64.decode(chunk, Base64.NO_WRAP);
                outputStream.write(buffer);
            } catch(Exception exception) {
                exception.printStackTrace();
            }
        }).start();
    }

    @ReactMethod
    void destroyWriteStream(String streamId) throws IOException {
        if (!writeStreams.containsKey(streamId)) return;
        OutputStream outputStream = writeStreams.get(streamId);
        outputStream.close();
        writeStreams.remove(streamId);
        sendEvent(streamId + "close", null);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @ReactMethod
    void resize(String path, int width, int height, Promise promise) throws IOException {
        File image = new File(path);
        byte[] buffer = Files.readAllBytes(image.toPath());
        Bitmap bitmap = BitmapFactory.decodeByteArray(buffer, 0, buffer.length);
        int sourceWidth;
        int sourceHeight;
        try {
            sourceWidth = bitmap.getWidth();
            sourceHeight = bitmap.getHeight();
        } catch(Exception exception) {
            exception.printStackTrace();
            promise.reject("Corrupted image");
            return;
        }
        float xScale = (float) width / sourceWidth;
        float yScale = (float) height / sourceHeight;
        float scale = Math.max(xScale, yScale);
        float scaledWidth = scale * sourceWidth;
        float scaledHeight = scale * sourceHeight;
        float left = (width - scaledWidth) / 2;
        float top = (height - scaledHeight) / 2;
        RectF targetRect = new RectF(left, top, left + scaledWidth, top + scaledHeight);
        Bitmap resized = Bitmap.createBitmap(width, height, bitmap.getConfig());
        Canvas canvas = new Canvas(resized);
        canvas.drawBitmap(bitmap, null, targetRect, null);
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            resized.compress(Bitmap.CompressFormat.WEBP_LOSSLESS, 100, byteArrayOutputStream);
        }
        byte[] byteArray = byteArrayOutputStream.toByteArray();
        String resizedBase64 = Base64.encodeToString(byteArray, Base64.NO_WRAP);
        byteArrayOutputStream.close();
        promise.resolve(resizedBase64);
    }

    @ReactMethod
    void watch(String watcherId, String path, Promise promise) {
        File directory = new File(path);
        if (!directory.exists()) promise.reject(path + " does not exist!");
        if (!directory.canRead()) promise.reject(path + " is not readable!");
        FileObserver watcher;
        if (this.watchers.containsKey(watcherId)) {
            watcher = this.watchers.get(watcherId);
            watcher.stopWatching();
            this.watchers.remove(watcherId);
        }
        watcher = new FileObserver(path) {
            @Override
            public void onEvent(int event, @Nullable String file) {
                //if (event == FileObserver.ALL_EVENTS) sendEvent(watcherId + path, event);
                String eventName = null;
                switch(event) {
                    case FileObserver.ATTRIB:
                        eventName = "attrib";
                        break;
                    case FileObserver.CREATE:
                        eventName = "create";
                        break;
                    case FileObserver.DELETE:
                        eventName = "delete";
                        break;
                    case FileObserver.MODIFY:
                        eventName = "modify";
                        break;
                    case FileObserver.MOVED_FROM:
                        eventName = "moved_from";
                        break;
                    case FileObserver.MOVED_TO:
                        eventName = "moved_to";
                        break;
                }
                if (eventName != null) {
                    WritableMap args = Arguments.createMap();
                    args.putString("event", eventName);
                    args.putString("file", file);
                    sendEvent(watcherId + path, args);
                }
            }
        };
        watcher.startWatching();
        this.watchers.put(watcherId, watcher);
        promise.resolve(null);
    }

    @ReactMethod
    void closeWatcher(String watcherId, Promise promise) {
        if (!this.watchers.containsKey(watcherId)) promise.reject("You must watch a directory first!");
        FileObserver watcher = this.watchers.get(watcherId);
        watcher.stopWatching();
        this.watchers.remove(watcherId);
        sendEvent(watcherId + "close", null);
        promise.resolve(null);
    }
}

class AndroidFsReactPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AndroidFsModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}