// miniprogram/subPack-a/pages/friend-circle/friend-circle.js
import { handleTop, sharePage } from "../../../utils/common";
const app = getApp();
Page({

  data: {
    friendCircleDetail: {},
    $showToolBox: true,
    SBH: app.globalData.device.SBH,
    onTop: true,
  },

  onLoad() {
    let friendCircleDetail = wx.getStorageSync('FRIEND_CIRCLE');
    if (!friendCircleDetail) {
      friendCircleDetail = {
        banner: '',
        name: app.globalData.theme.data.defaultUserName,
        header: '',
        record: [],
      };
    }
    this.setData({ friendCircleDetail });
    this.refreshFriendCircleStorage();
  },

  // 显示工具箱
  showToolBox() {
    this.setData({ $showToolBox: true });
  },

  handleToolBoxChange(e) {
    let change = e.detail.change;
    let data = e.detail.data;
    switch (change) {
      case 'friendCircle': this.handleEditFriendCircle(data); break;
      case 'clearAll': this.handleClearAll(); break;
    }
  },

  handleEditFriendCircle(data) {
    let detail = this.data.friendCircleDetail;
    this.setData({ friendCircleDetail: { ...detail, ...data } }, () => { this.refreshFriendCircleStorage(); });
  },

  handleClearAll() {
    this.data.friendCircleDetail.record = [];
    this.setData({ friendCircleDetail: this.data.friendCircleDetail }, () => { this.refreshFriendCircleStorage(); });
  },

  refreshFriendCircleStorage() {
    wx.setStorageSync('FRIEND_CIRCLE', this.data.friendCircleDetail);
  },

  onPageScroll(e) {
    handleTop(this, e);
  },

  onShareAppMessage() {
    return sharePage();
  }
});