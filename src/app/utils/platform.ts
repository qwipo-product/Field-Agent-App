import * as platform from '@nativescript/core/platform';

export function isAndroid() {
  return platform.Device.os === platform.platformNames.android;
}

export function isIOS() {
  return platform.Device.os === platform.platformNames.ios;
}
