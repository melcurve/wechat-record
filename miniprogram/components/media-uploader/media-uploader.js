// components/media-uploader/media-uploader.js
import { toast, dataset } from "../../utils/common";
Component({
  properties: {
    // 用于表单使用的值
    value: {
      type: Array,
      value: []
    },
    // 最大数量限制
    maxLength: {
      type: Number,
    }
  },

  data: {
    // 用于组件显示的值
    list: [],
    // 历史图片
    historyList: [],
    // 是否显示历史记录弹窗
    $showHistoryPopup: false,
  },

  lifetimes: {
    attached() {
      this.historyPopup = this.selectComponent('#historyPopup');
    }
  },

  observers: {
    // 监听数值变化
    ['value'](value) {
      // 将数值格式化并赋值到list数组
      if (value) this.setData({ list: value.map((item) => { return { url: item }; }) });
    }
  },

  methods: {
    // 显示历史记录图片，从缓存中获取
    history() {
      const chatList = wx.getStorageSync('CHAT_LIST') || [];
      const chatDetail = wx.getStorageSync('CHAT_DETAIL') || {};
      const historyList = [];
      chatList.map((item) => { if (item.header) historyList.push(...item.header); });
      for (let key in chatDetail) {
        let item = chatDetail[key];
        item.record.map((ritem) => {
          if (ritem.header) historyList.push(ritem.header);
          if (ritem.media) historyList.push(ritem.media);
        });
      }
      this.setData({
        historyList: [...new Set(historyList)],
        $showHistoryPopup: true
      });
    },

    // 选择历史图片中的照片
    handleSelectHistory(e) {
      let item = dataset(e, 'item');
      this.add([item]);
      this.setData({ $showHistoryPopup: false });
      this.historyPopup.handleClose();
    },

    // 选择图片
    select() {
      const maxLength = this.data.maxLength || '';
      const list = this.data.list;

      // 最大数量限制，如果限制为1张，则不会提示，选择的图片会覆盖现有的一张图
      if (maxLength && list.length >= maxLength && maxLength != 1) {
        toast.fail(`最多只能选择${maxLength}张图`);
        return;
      }

      const count = maxLength == 1 ? 1 : maxLength - list.length;
      wx.chooseImage({
        count: count >= 9 ? 9 : count,
        sizeType: ['compressed'],
      }).then((res) => {
        this.add(res.tempFilePaths);
      });
    },

    // 添加照片
    add(data) {
      const maxLength = this.data.maxLength || '';
      // 更新list操作
      if (maxLength == 1) this.data.list = [{ url: data[0] }];
      else this.data.list = [...this.data.list, ...data.map((item) => { return { url: item }; })];
      this.setData({ list: this.data.list }, () => this.change());
    },

    // 删除
    remove(e) {
      wx.showActionSheet({
        itemList: ['删除'],
      }).then((res) => {
        if (res.tapIndex == 0) {
          const index = dataset(e, 'index');
          this.data.list.splice(index, 1);
          this.setData({
            list: this.data.list
          }, () => this.change());
        }
      });
    },

    // 预览图片
    preview(e) {
      const item = dataset(e, 'item');
      const current = item.url;
      const urls = this.data.list.map((vitem) => { return vitem.url; });
      wx.previewImage({
        current,
        urls,
      });
    },

    // 变更回调
    change() {
      this.triggerEvent('change', { value: this.data.list.map((item) => { return item.url; }) });
    }
  }
});
