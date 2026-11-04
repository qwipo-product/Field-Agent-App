import { Mode, OptionsCommon } from '@nstudio/nativescript-loading-indicator';

export {isAndroid, isIOS} from './platform';
export {isValidEmail} from './validations';

export var loaderOptions: OptionsCommon = {
  message: 'Loading...',
  progress: 0.65,
  margin: 10,
  dimBackground: true,
  color: '#3f51b5',
  backgroundColor: '#ffffff',
  userInteractionEnabled: false,
  mode: Mode.Indeterminate,
  android: {
    cancelable: false,
    max: 100,
    progressNumberFormat: "%1d/%2d",
    progressPercentFormat: 0.53,
    progressStyle: 1,
    secondaryProgress: 1
  }
};

export var animationObject = {
  animated: true,
  transition: {
    name: "slide",
    duration: 380,
    curve: "easeIn"
  }
};
export var clearHistoryAnimation = {
  clearHistory: true,
  animationObject
}
