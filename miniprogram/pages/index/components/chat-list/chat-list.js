// pages/index/components/chat-list/chat-list.js
import { wechatDate, dataset, toast, to, getId, refreshChatItemStorage, db } from "../../../../utils/common";
const app = getApp();
Component({
  properties: {},

  data: {
    // 是否显示工具箱按钮
    $showToolBox: true,
    // 标题
    title: '',
    // 聊天列表
    chatList: [],
  },

  lifetimes: {
    attached() {
      this.titleLabel = app.globalData.theme.data.tabList[0].name;
      this.setData({ title: this.titleLabel });

      // 获取toolBox组件对象
      this.toolBox = this.selectComponent('#toolBox');

      // 从缓存中获取聊天列表
      let chatList = db.get('CHAT_LIST') || [];

      this.setData({ chatList });
    }
  },

  observers: {
    // 监听chatList变化
    ['chatList'](value) {
      // 设置标题
      this.handleSetTitle(value);
    }
  },

  methods: {
    // 显示工具箱
    showToolBox() {
      this.setData({ $showToolBox: true });
    },

    // 设置标题和未读数
    handleSetTitle(chatList) {
      let title = this.titleLabel;
      if (chatList && chatList.length) {
        let unReadCount = 0;
        chatList.map((item) => { unReadCount += Number(item.badge) || 0; });
        if (unReadCount) title += ` (${unReadCount})`;
      }
      this.setData({ title });
    },

    // 工具箱变更回调
    handleToolBoxChange(e) {
      let change = e.detail.change;
      let data = e.detail.data;
      switch (change) {
        case 'addChat': this.handleAddChat(data); break;
        case 'editChat': this.handleEditChatList(data); break;
        case 'clearAll': this.handleClearAll(); break;
      }
    },

    // 插入新聊天记录
    handleAddChat(data) {
      // 格式化时间
      data.displayDate = wechatDate(data.date, data.time);

      // 设置id
      const id = getId();
      data.id = id;

      // 设置默认名称
      if (!data.name) data.name = app.globalData.theme.data.defaultUserName;

      // 插入记录
      this.data.chatList.push(data);
      this.setData({ chatList: this.data.chatList });

      // 更新缓存
      refreshChatItemStorage(this.data.chatList);
      this.refreshBadge();

      toast.fail('添加成功');
    },

    // 更新聊天
    handleEditChatList(item) {
      let index = this.data.chatList.findIndex((citem) => citem.id == item.id);
      item.displayDate = wechatDate(item.date, item.time);
      this.data.chatList[index] = item;
      refreshChatItemStorage(this.data.chatList);
      this.refreshBadge();
      this.setData({ chatList: this.data.chatList });
      toast.fail('编辑成功');
    },

    // 显示单个聊天操作菜单
    showChatMenu(e) {
      let item = dataset(e, 'item');
      let index = dataset(e, 'index');
      wx.showActionSheet({
        itemList: ['上移', '下移', '编辑', '删除'],
      }).then((res) => {
        switch (res.tapIndex) {
          case 0: this.handleUpper(index); break;
          case 1: this.handleLower(index); break;
          case 2: this.toolBox.handleEditChatList(item); break;
          case 3: this.handleDeleteChat(index); break;
        }
      });
    },

    // 上移聊天
    handleUpper(index) {
      if (index == 0) { toast.fail('已经是第一位，无法上移'); return; }
      let spliceItem = this.data.chatList[index - 1];
      this.data.chatList[index - 1] = this.data.chatList[index];
      this.data.chatList[index] = spliceItem;
      refreshChatItemStorage(this.data.chatList);
      this.setData({ chatList: this.data.chatList });
    },

    // 下移聊天
    handleLower(index) {
      if (index == this.data.chatList.length - 1) { toast.fail('已经是最后一位，无法下移'); return; }
      let spliceItem = this.data.chatList[index + 1];
      this.data.chatList[index + 1] = this.data.chatList[index];
      this.data.chatList[index] = spliceItem;
      refreshChatItemStorage(this.data.chatList);
      this.setData({ chatList: this.data.chatList });
    },

    // 删除聊天
    handleDeleteChat(index) {
      this.data.chatList.splice(index, 1);
      refreshChatItemStorage(this.data.chatList);
      this.refreshBadge();
      this.setData({ chatList: this.data.chatList }, () => toast.fail('已删除'));
    },

    // 清空所有聊天
    handleClearAll() {
      wx.showModal({
        content: '确定清空所有聊天吗？',
        confirmText: '清空',
      }).then((res) => {
        if (res.confirm) {
          this.data.chatList = [];
          this.setData({ chatList: this.data.chatList });
          refreshChatItemStorage(this.data.chatList);
          this.refreshBadge();
          toast.fail('已清空所有聊天缓存');
          to('/pages/index/index', 'reLaunch');
        }
      });
    },

    // 通知index页面刷新tabBar的红点数
    refreshBadge() {
      this.triggerEvent('refreshBadge');
    },

    // 跳转到聊天详情
    toChatDetail(e) {
      let item = dataset(e, 'item');
      to(`/subPack-a/pages/chat-detail/chat-detail?id=${item.id}`);
    },
  }
});
