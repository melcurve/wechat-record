// pages/index/components/contact-list/contact-list.js
const app = getApp();
Component({
  properties: {

  },

  data: {
    // 标题
    title: '',
  },

  lifetimes: {
    attached() {
      this.titleLabel = app.globalData.theme.data.tabList[1].name;
      this.setData({ title: this.titleLabel });
    }
  },

  methods: {

  }
});
