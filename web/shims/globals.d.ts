// Globals the app's NativeScript code mentions. In the browser they are only reached on code paths
// that never run (iOS branches, Android file downloads), so loose types are enough.
declare var module: { id: string };
declare var android: any;
declare var java: any;
declare var UIApplication: any;
declare var UIApplicationDelegate: any;
declare function require(id: string): any;
