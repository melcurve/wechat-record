// app.js
import { onLaunchAction } from "./utils/common";
App({
  onLaunch(e) {
    let config = {
      events: e,
    };
    onLaunchAction(this, config);
  },

  globalData: {}
})