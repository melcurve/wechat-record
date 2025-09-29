// subPack-a/pages/chat-detail/chat-detail.js
import {
  toast,
  delay,
  dataset,
  getId,
  valid,
  to,
  db
} from "../../../utils/common";
const app = getApp();
Page({
  data: {
    // 是否显示工具箱按钮
    $showToolBox: true,
    $showUtilBlock: false,
    scrollTop: 0,
    swiperIndex: 0,
    chatDetail: {},
    inputValue: '',
    utilList: [
      [{
          label: '照片',
          icon: '1',
          action: 'media'
        },
        {
          label: '拍摄',
          icon: '2',
          action: 'media'
        },
        {
          label: '视频通话',
          icon: '3',
          action: 'videoChat'
        },
        {
          label: '位置',
          icon: '4'
        },
        {
          label: '红包',
          icon: '5',
          action: 'redPack'
        },
        {
          label: '转账',
          icon: '6',
          action: 'transfer'
        },
        {
          label: '语音输入',
          icon: '7'
        },
        {
          label: '收藏',
          icon: '8'
        },
      ],
      [{
          label: '个人名片',
          icon: '9'
        },
        {
          label: '文件',
          icon: '10'
        },
        {
          label: '卡券',
          icon: '11'
        },
      ]
    ]
  },

  onLoad: function (options) {
    this.id = options.id;
    this.toolBox = this.selectComponent('#toolBox');
    this.getDetail();
  },

  getDetail() {
    // 判断chatList中是否存在此id
    const chatList = db.get('CHAT_LIST') || [];
    let chatListItem = chatList.find((item) => item.id == this.id);
    if (!chatList || !chatListItem) {
      toast.fail('聊天不存在，请重新创建');
      delay(() => {
        to('/pages/index/index', 'reLaunch');
      }, 1500);
      return;
    }

    // 获取聊天详细信息
    const storage = db.get('CHAT_DETAIL') || {};

    if (storage[this.id]) this.data.chatDetail = storage[this.id];
    else this.data.chatDetail = {
      title: chatListItem.name || app.globalData.theme.data.defaultUserName,
      record: []
    };

    this.data.chatDetail.record = this.formatRecord(this.data.chatDetail.record);

    this.setData({
      chatDetail: this.data.chatDetail
    }, () => {
      this.scrollToBottom();
    });
    this.refreshStorage();
  },

  previewImage(e) {
    let item = dataset(e, 'item');
    let urls = this.data.chatDetail.record.filter((item) => item.type == 'media' && item.media).map((item) => {
      return item.media[0];
    });
    wx.previewImage({
      current: item.media[0],
      urls,
    });
  },

  handleSwiperChange(e) {
    this.setData({
      swiperIndex: e.detail.current
    });
  },

  showToolBox() {
    this.setData({
      $showToolBox: true
    });
  },

  handleHideUtilBlock() {
    this.setData({
      $showUtilBlock: false
    });
  },

  handleShowUtilBlock() {
    this.setData({
      $showUtilBlock: !this.data.$showUtilBlock
    });
  },

  handleUtilAction(e) {
    let action = dataset(e, 'action');
    if (!action) {
      toast.fail('尝试下其他功能吧');
      return;
    }
    this.toolBox.showActionInChatDetail(2);
    this.toolBox.chatDetailSF.setFormData({
      type: action
    });
  },

  handleToolBoxChange(e) {
    let change = e.detail.change;
    let data = e.detail.data;
    switch (change) {
      case 'editChat':
        this.handleEditChat(data);
        break;
      case 'addChatDetail':
        this.handleAddChatDetail(data);
        break;
      case 'editChatDetail':
        this.handleEditChatDetail(data);
        break;
      case 'clearAll':
        this.handleClearAll();
        break;
    }
  },

  handleEditChat(data) {
    this.data.chatDetail.title = data.title;
    this.data.chatDetail.groupUserName = data.groupUserName;
    this.data.chatDetail.customBackground = data.customBackground;
    this.data.chatDetail.badge = data.badge;
    this.setData({
      chatDetail: this.data.chatDetail
    });
    this.refreshStorage();
  },

  handleSend(e) {
    if (!valid(e.detail.value)) {
      toast.fail('请你叭要发送空白消息');
      return;
    }
    let lastRecord = this.data.chatDetail?.record?.length ? this.data.chatDetail.record[this.data.chatDetail.record.length - 1] : null;
    let data = {
      side: lastRecord?.side || 'right',
      type: 'text',
      text: e.detail.value,
      header: lastRecord?.header || null,
      name: lastRecord?.name || null,
    };
    this.handleAddChatDetail(data);
    this.setData({
      inputValue: ''
    });
  },

  getImageSize(src) {
    return wx.getImageInfo({
      src
    });
  },

  formatImageSize(imageSize) {
    if (!imageSize || !imageSize.width || !imageSize.height) return null;

    // px -> rpx换算倍数
    let resp = 750 / app.globalData.device.screenWidth;
    // 最大高度/宽度，单位rpx
    let maxSize = 280;
    let minSize = 100;
    let width = imageSize.width * resp;
    let height = imageSize.height * resp;
    let scale = width / height;

    // 格式化过后的宽高
    let fixedWidth = 0;
    let fixedHeight = 0;
    if (width > height) {
      fixedWidth = maxSize;
      fixedHeight = fixedWidth / scale;
    } else if (width < height) {
      fixedHeight = maxSize;
      fixedWidth = fixedHeight * scale;
    } else {
      fixedWidth = fixedHeight = maxSize;
    }

    if (fixedWidth < minSize) fixedWidth = minSize;
    if (fixedHeight < minSize) fixedHeight = minSize;

    return {
      width: fixedWidth,
      height: fixedHeight
    };
  },

  formatRecord(record) {
    record.map((item) => {
      if (item.type == 'media') {
        item.fixedSize = this.formatImageSize(item.size);
      }
    });
    return record;
  },

  async handleAddChatDetail(data) {
    let pushData = [];

    // 设置默认名称
    if (!data.name) data.name = app.globalData.theme.data.defaultUserName;

    if (data.type == 'media' && data.media) {
      await Promise.all(data.media.map(async (item) => {
        const id = getId();
        let imageInfo = await this.getImageSize(item);
        pushData.push({
          ...data,
          id,
          media: [item],
          size: {
            width: imageInfo.width,
            height: imageInfo.height
          }
        });
      }));
    } else {
      const id = getId();
      pushData = [{
        ...data,
        id
      }];
    }

    // 插入记录
    this.data.chatDetail.record.push(...pushData);

    this.data.chatDetail.record = this.formatRecord(this.data.chatDetail.record);

    this.setData({
      chatDetail: this.data.chatDetail,
      $showUtilBlock: false,
    });

    // 更新缓存
    this.refreshStorage();
    this.handleHideUtilBlock();

    this.scrollToBottom();
    toast.fail('添加成功');
  },

  scrollToBottom() {
    delay(() => {
      wx.createSelectorQuery()
        .select("#scrollWrapper")
        .boundingClientRect()
        .exec((res) => {
          this.setData({
            scrollTop: res[0].height || 2147483647
          });
        });
    });
  },

  async handleEditChatDetail(item) {

    if (item.type == 'media') {
      let imageInfo = await this.getImageSize(item.media[0]);
      item.size = {
        width: imageInfo.width,
        height: imageInfo.height
      };
    }

    let index = this.data.chatDetail.record.findIndex((citem) => citem.id == item.id);
    this.data.chatDetail.record[index] = item;
    this.refreshStorage();

    this.data.chatDetail.record = this.formatRecord(this.data.chatDetail.record);

    this.setData({
      chatDetail: this.data.chatDetail
    });
    toast.fail('编辑成功');
  },

  // 显示单个聊天记录操作菜单
  showChatRecordMenu(e) {
    let item = dataset(e, 'item');
    let index = dataset(e, 'index');
    wx.showActionSheet({
      itemList: ['上移', '下移', '编辑', '删除'],
    }).then((res) => {
      switch (res.tapIndex) {
        case 0:
          this.handleUpper(index);
          break;
        case 1:
          this.handleLower(index);
          break;
        case 2:
          this.toolBox.handleEditChatDetail(item);
          break;
        case 3:
          this.handleDeleteChatDetail(index);
          break;
      }
    });
  },

  // 上移聊天
  handleUpper(index) {
    if (index == 0) {
      toast.fail('已经是第一位，无法上移');
      return;
    }
    let record = this.data.chatDetail.record;
    let spliceItem = record[index - 1];
    record[index - 1] = record[index];
    record[index] = spliceItem;
    this.refreshStorage();
    this.setData({
      [`chatDetail.record`]: record
    });
  },

  // 下移聊天
  handleLower(index) {
    let record = this.data.chatDetail.record;
    if (index == record.length - 1) {
      toast.fail('已经是最后一位，无法下移');
      return;
    }
    let spliceItem = record[index + 1];
    record[index + 1] = record[index];
    record[index] = spliceItem;
    this.refreshStorage();
    this.setData({
      [`chatDetail.record`]: record
    });
  },

  // 删除聊天
  handleDeleteChatDetail(index) {
    let record = this.data.chatDetail.record;
    record.splice(index, 1);
    this.refreshStorage();
    this.setData({
      [`chatDetail.record`]: record
    }, () => toast.fail('已删除'));
  },

  handleClearAll() {
    wx.showModal({
      content: '确定清空所有聊天记录吗？',
      confirmText: '清空',
    }).then((res) => {
      if (res.confirm) {
        this.data.chatDetail.record = [];
        this.setData({
          chatDetail: this.data.chatDetail
        });
        this.refreshStorage();
        toast.fail('已清空所有聊天记录');
      }
    });
  },

  refreshStorage() {
    const storage = db.get('CHAT_DETAIL') || {};
    storage[this.id] = this.data.chatDetail;
    db.set('CHAT_DETAIL', storage);
  },

  onShareAppMessage() {
    return sharePage();
  }
});