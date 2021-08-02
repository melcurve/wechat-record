// index.js
import { sharePage } from "../../utils/common";
Page({
  data: {
    tabIndex: 3
  },

  onLoad() {
    this.tabBar = this.selectComponent('#tabBar');
  },

  refreshBadge() {
    this.tabBar.refreshBadge();
  },

  switchTab(e) {
    this.setData({ tabIndex: e.detail.index });
  },

  onShareAppMessage() {
    return sharePage();
  }
});