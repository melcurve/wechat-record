// components/tab-bar/tab-bar.js
import { dataset } from "../../utils/common";
const app = getApp();
Component({
  properties: {
    // tab栏当前位置
    tabIndex: {
      type: Number,
      value: 0
    }
  },

  data: {
    // tab栏数据
    tabList: []
  },

  lifetimes: {
    attached() {
      this.setData({
        tabList: app.globalData.theme.data.tabList
      });
      this.refreshBadge();
    }
  },

  methods: {
    // 切换tab回调
    switchTab(e) {
      this.triggerEvent('switchTab', { index: dataset(e, 'index') });
    },

    // 刷新红点
    refreshBadge() {
      let badge = [0, 0, 0, 0];
      const chatList = wx.getStorageSync('CHAT_LIST') || [];
      chatList.map((item) => {
        if (item.badge) badge[0] += Number(item.badge);
      });
      badge.map((item, index) => { this.data.tabList[index].badge = item; });
      this.setData({ tabList: this.data.tabList });
    },
  }
});
