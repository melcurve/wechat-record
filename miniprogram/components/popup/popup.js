// components/popup/popup.js
const { delay } = require("../../utils/common");
const app = getApp();
Component({
  properties: {
    // 是否显示弹窗（作为组件开关触发，告知组件当前显示状态）
    visible: {
      type: Boolean,
      value: false
    },
    // 弹窗标题
    title: {
      type: String,
      value: '新弹窗'
    },
    // 确定按钮文本
    confirmText: {
      type: String,
      value: '确定'
    },
    // 关闭按钮文本
    cancelText: {
      type: String,
      value: '关闭'
    },
  },

  data: {
    // 弹窗是否渲染在页面（用于判断组件是否渲染在页面上）
    exist: false,
    // 弹窗是否显示（用于渲染组件后，判断组件显隐动画）
    show: false,

    SBH: app.globalData.device.SBH
  },

  observers: {
    // 监听visible
    ['visible'](value) {
      // 如果组件需要显示，首先渲染组件（exist），然后打开动画（show）
      if (value) this.setData({ exist: true }, () => { this.setData({ show: true }); });
    }
  },

  methods: {
    // 关闭弹窗操作，首先关闭动画和visible，然后卸载组件
    handleClose() {
      this.setData({ visible: false, show: false });
      delay(() => {
        this.setData({ exist: false });
      }, 400);
    },

    // 关闭弹窗
    close() {
      this.handleClose();
      this.triggerEvent('close');
    },

    // 点击确认
    confirm() {
      this.handleClose();
      this.triggerEvent('confirm');
    },
  }
});
