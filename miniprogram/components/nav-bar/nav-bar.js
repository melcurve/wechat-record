// components/nav-bar/nav-bar.js
const app = getApp();
Component({
  properties: {
    // 标题文本
    title: {
      type: String,
    },
    // 是否预留标题栏下的位置
    blank: {
      type: Boolean,
      value: true
    },
    // 是否显示分割线
    border: {
      type: Boolean,
    },
    // 是否显示返回按钮
    back: {
      type: Boolean,
    },
    // 左上角未读数量
    badge: {
      type: Number,
    },
    // 背景
    bg: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 标题栏高度
    SBH: app.globalData.device.SBH
  },

  methods: {
    // 长按回调
    longpress() {
      this.triggerEvent('longpress');
    },
    // 返回
    handleBack() {
      wx.navigateBack().catch(() => {
        wx.redirectTo({
          url: '/pages/index/index',
        });
      });
    },
  }
});