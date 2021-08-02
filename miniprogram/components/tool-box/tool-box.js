// components/tool-box/tool-box.js
const { discoveryList } = require("../../assets/discovery-list");
const { getEnum, toast, valid, hideAll, delay } = require("../../utils/common");
Component({
  properties: {
    // 是否显示工具箱按钮
    visible: {
      type: Boolean,
      value: true
    },
    // 是否上移按钮
    spaceFix: {
      type: Boolean
    }
  },

  data: {
    // 是否显示聊天弹窗
    $showChatListPopup: false,
    // 是否显示聊天记录弹窗
    $showChatDetailPopup: false,
    // 是否显示编辑标题弹窗
    $showEditChatPopup: false,
    // 是否显示朋友圈设置弹窗
    $showFriendCirclePopup: false,
    // 是否显示动态弹窗
    $showDynamicPopup: false,
    // 聊天表单项
    chatListSchema: {
      id: { type: 'hidden' },
      header: {
        title: '头像',
        type: 'media',
        maxLength: 9,
        description: '上传多张头像将变成群聊图标（最多9张）',
      },
      badge: {
        title: '红点数',
        type: 'number',
        placeholder: '请输入红点数',
        description: '不输入则不显示，输入0则显示一个小红点',
      },
      name: {
        title: '名称',
        type: 'input',
        history: true,
        placeholder: '请输入名称',
      },
      content: {
        title: '聊天内容',
        type: 'input',
        history: true,
        placeholder: '请输入聊天内容',
      },
      tag: {
        title: '红字标签',
        type: 'input',
        placeholder: '请输入红字标签',
        description: '聊天内容前的红字标签，比如[转账]、[语音]等，不用打中括号'
      },
      date: {
        title: '日期',
        type: 'date',
        placeholder: '请选择日期',
        description: '如果同时填写了日期和时间，系统会根据你所填日期时间显示为如00:25/昨天/星期六等，建议完整填写',
      },
      time: {
        title: '时间',
        type: 'time',
        placeholder: '请选择时间',
      },
      isServiceAccount: {
        title: '是否为服务号（名称为蓝色）',
        type: 'radio',
        enum: getEnum(['否', '是'], 2),
        default: 0,
      },
      top: {
        title: '是否置顶',
        type: 'radio',
        enum: getEnum(['否', '是'], 2),
        default: 0,
      },
    },
    // 聊天记录表单项
    chatDetailSchema: {
      id: { type: 'hidden' },
      type: {
        type: 'selector',
        title: '消息类型',
        enum: [
          { label: '普通文本', value: 'text' },
          { label: '图片/视频', value: 'media' },
          { label: '单条语音', value: 'audio' },
          // { label: '视频通话', value: 'videoChat' },
          // { label: '语音通话', value: 'audioChat' },
          { label: '红包', value: 'redPack' },
          { label: '转账', value: 'transfer' },
          { label: '系统提示', value: 'system' },
          { label: '红包领取提示', value: 'redPackNotice' },
        ],
        default: 'text',
      },
      side: {
        type: 'radio',
        title: '消息位置',
        enum: [{ label: '左侧', value: 'left' }, { label: '右侧', value: 'right' }],
        visibleIf: { type: (val) => val != 'system' && val != 'redPackNotice' },
        default: 'right',
      },
      date: {
        title: '发送时间',
        type: 'input',
        placeholder: '请填写发送时间',
        description: '为了最大化自定义程度，请自行填入发送时间，添加后会按照用户填写的内容显示，为了使效果更逼真，请按照示例规范填写。示例：[11:50]、[昨天 14:32]、[星期三 19:01]、[2021年7月5日 08:05]',
      },
      header: {
        type: 'media',
        title: '头像',
        maxLength: 1,
        visibleIf: { type: (val) => val != 'system' }
      },
      name: {
        type: 'input',
        title: '名称',
        placeholder: '请输入名称',
        history: true,
        visibleIf: { type: (val) => val != 'system' }
      },
      text: {
        type: 'input',
        title: '文本内容',
        placeholder: '请输入文本内容',
        history: true,
        visibleIf: { type: ['text'] }
      },
      systemText: {
        type: 'input',
        title: '系统消息',
        placeholder: '请输入系统消息',
        history: true,
        description: 'Tips：系统消息亦可作为拍一拍文本使用',
        visibleIf: { type: ['system'] },
      },
      systemTextBold: {
        type: 'radio',
        title: '系统消息是否为粗体',
        enum: getEnum(['否', '是'], 2),
        description: 'Tips：如果系统消息作为拍一拍文本使用，对方拍你需要显示为粗体',
        visibleIf: { type: ['system'] },
        default: 0
      },
      redPackNotice: {
        type: 'input',
        title: '领取人名称',
        history: true,
        placeholder: '请输入领取方的名称',
        description: '将会显示为 xxx领取了你的红包',
        visibleIf: { type: ['redPackNotice'] }
      },
      media: {
        type: 'media',
        title: '图片/视频',
        visibleIf: { type: ['media'] }
      },
      duration: {
        type: 'number',
        title: '时长',
        placeholder: '请输入通话时长',
        visibleIf: { type: ['audio', 'videoChat', 'audioChat'] }
      },
      price: {
        type: 'digit',
        title: '金额',
        placeholder: '请输入金额',
        visibleIf: { type: ['redPack', 'transfer'] }
      },
      remark: {
        type: 'input',
        title: '备注内容',
        history: true,
        placeholder: '请输入备注',
        visibleIf: { type: ['redPack', 'transfer'] },
        default: '恭喜发财，大吉大利',
      },
      transferStatus: {
        type: 'radio',
        title: '状态',
        enum: [
          { label: '正常', value: 'normal' },
          { label: '已领取(收款方)', value: 'received' },
          { label: '已被领取(发款方)', value: 'beReceived' },
          { label: '已过期', value: 'expired' },
          { label: '已退回(收款方)', value: 'returned' },
          { label: '已被退回(发款方)', value: 'beReturned' },
        ],
        description: '领取和退回的状态在发款/收款两边显示文案不同，最好自行实际体验下区别',
        visibleIf: { type: ['redPack', 'transfer'] },
        default: 'normal'
      },
    },
    // 编辑标题表单项
    editChatSchema: {
      title: {
        type: 'input',
        title: '标题',
        history: true,
        placeholder: '请输入标题',
      },
      badge: {
        type: 'number',
        title: '未读数',
        placeholder: '请输入未读数',
      },
      customBackground: {
        title: '自定义背景',
        type: 'media',
        maxLength: 1,
      },
      groupUserName: {
        title: '是否显示群员名字',
        type: 'radio',
        enum: getEnum(['隐藏', '显示'], 2),
        default: 0
      }
    },
    // 编辑发现页表单项
    discoverySchema: {},
    // 朋友圈设置表单项
    friendCircleSchema: {
      banner: {
        type: 'media',
        title: '朋友圈封面',
        maxLength: 1,
      },
      header: {
        type: 'media',
        title: '用户头像',
        maxLength: 1,
      },
      name: {
        type: 'input',
        title: '用户名称',
        history: true,
        placeholder: '请输入用户名称',
      },
    },
    // 动态表单项
    dynamicSchema: {
      header: {
        type: 'media',
        title: '用户头像',
        maxLength: 1,
      },
      name: {
        type: 'input',
        title: '用户名称',
        history: true,
        placeholder: '请输入用户名称',
      },
      picture: {
        type: 'media',
        title: '图片',
        maxLength: 9,
      },
      date: {
        type: 'input',
        title: '时间',
        placeholder: '请输入时间',
      }
    },
  },

  methods: {
    // 点击工具箱按钮事件
    showAction() {
      // 获取当前页面
      let pages = getCurrentPages();
      let currentPage = pages[pages.length - 1];
      let url = currentPage.route;

      // 通过当前页面判断要打开哪个actionSheet
      if (url == 'pages/index/index') {
        const tabIndex = currentPage.data.tabIndex;
        if (tabIndex == 0) this.showActionInChatList();
        if (tabIndex == 2) this.showActionInDiscovery();
      } else if (url == 'subPack-a/pages/chat-detail/chat-detail') {
        this.showActionInChatDetail();
      } else if (url == 'subPack-a/pages/friend-circle/friend-circle') {
        this.showActionInFriendCircle();
      }
    },

    // 添加聊天列表
    showActionInChatList() {
      let itemList = ['添加聊天', '删除所有聊天', '隐藏工具箱按钮', '清空缓存'];
      wx.showActionSheet({
        alertText: '聊天列表工具箱',
        itemList,
      }).then((res) => {
        switch (res.tapIndex) {
          case 0:
            this.setData({ $showChatListPopup: true }, () => {
              // 获取聊天弹窗组件对象
              this.chatListSF = this.selectComponent('#chatListSF');
            });
            break;
          case 1:
            this.handleChange('clearAll');
            break;
          case 2:
            this.handleHide();
            break;
          case 3:
            this.handleChange('clearAll');
            break;
        }
      }).catch(() => null);
    },

    // 添加聊天记录
    showActionInChatDetail(index) {
      const handleAction = (tapIndex) => {
        switch (tapIndex) {
          case 0:
            this.setData({ $showEditChatPopup: true }, () => {
              // 获取编辑标题弹窗组件对象
              this.editChatSF = this.selectComponent('#editChatSF');
            });
            break;
          case 1:
            this.setData({ $showChatDetailPopup: true }, () => {
              // 获取聊天记录弹窗组件对象
              this.chatDetailSF = this.selectComponent('#chatDetailSF');
            });
            break;
          case 2:
            this.handleChange('clearAll');
            break;
          case 3:
            this.handleHide();
            break;
        }
      };
      if (valid(index)) {
        handleAction(index);
        return;
      }
      let itemList = ['聊天窗口设置', '添加聊天记录', '清空所有聊天记录', '隐藏工具箱按钮'];
      wx.showActionSheet({
        alertText: '聊天详情工具箱',
        itemList,
      }).then((res) => {
        handleAction(res.tapIndex);
      }).catch(() => null);
    },

    // 发现页选择
    showActionInDiscovery() {
      let itemList = ['发现页设置', '隐藏工具箱按钮'];
      wx.showActionSheet({
        alertText: '发现页工具箱',
        itemList,
      }).then((res) => {
        switch (res.tapIndex) {
          case 0:
            this.data.discoverySchema = {};
            discoveryList.map((item) => {
              this.data.discoverySchema[`${item.id}`] = {
                title: item.name,
                switchLabel: '是否显示',
                type: 'boolean',
                default: true,
              };
            });
            this.setData({
              $showDiscoveryPopup: true,
              discoverySchema: this.data.discoverySchema,
            }, () => {
              // 获取聊天弹窗组件对象
              this.discoverySF = this.selectComponent('#discoverySF');
              let data = wx.getStorageSync('DISCOVERY_LIST') || {};
              for (let key in data) {
                data[key] = !!data[key];
              }
              this.discoverySF.setFormData(data);
            });
            break;
          case 1:
            this.handleHide();
            break;
        }
      }).catch(() => null);
    },

    // 朋友圈
    showActionInFriendCircle() {
      let itemList = ['朋友圈设置', '添加动态', '清空动态', '隐藏工具箱按钮'];
      wx.showActionSheet({
        alertText: '朋友圈工具箱',
        itemList,
      }).then((res) => {
        switch (res.tapIndex) {
          case 0:
            this.setData({ $showFriendCirclePopup: true }, () => {
              // 获取朋友圈设置弹窗组件对象
              this.friendCircleSF = this.selectComponent('#friendCircleSF');
            });
            break;
          case 1:
            this.setData({ $showDynamicPopup: true }, () => {
              // 获取动态弹窗组件对象
              this.dynamicSF = this.selectComponent('#dynamicSF');
            });
            break;
          case 2:
            this.handleChange('clearAll');
            break;
          case 3:
            this.handleHide();
            break;
        }
      }).catch(() => null);
    },

    // 隐藏工具箱按钮
    handleHide() {
      toast.fail('长按顶部标题或重启小程序可重新显示工具箱按钮');
      this.setData({ visible: false });
    },

    // 显示编辑聊天弹窗
    handleEditChatList(item) {
      this.setData({ $showChatListPopup: true }, () => {
        // 获取聊天弹窗组件对象
        this.chatListSF = this.selectComponent('#chatListSF');
        this.chatListSF.setFormData(item);
      });
    },

    // 显示添加聊天弹窗
    handleAddChat() {
      this.handleClosePopup();
      let formData = this.chatListSF.getFormData();
      this.handleChange(formData.id ? 'editChat' : 'addChat', formData);
    },

    // 显示编辑聊天弹窗
    handleEditChatDetail(item) {
      this.setData({ $showChatDetailPopup: true }, () => {
        // 获取聊天记录弹窗组件对象
        this.chatDetailSF = this.selectComponent('#chatDetailSF');
        this.chatDetailSF.setFormData(item);
      });
    },

    // 添加/编辑聊天记录变更
    handleAddChatDetail() {
      this.handleClosePopup();
      let formData = this.chatDetailSF.getFormData();
      this.handleChange(formData.id ? 'editChatDetail' : 'addChatDetail', formData);
    },

    // 编辑标题变更
    handleEditChat() {
      this.handleClosePopup();
      let formData = this.editChatSF.getFormData();
      this.handleChange('editChat', formData);
    },

    // 编辑发现页设置
    handleDiscovery() {
      this.handleClosePopup();
      let formData = this.discoverySF.getFormData();
      this.handleChange('discovery', formData);
    },

    // 编辑朋友圈设置
    handleFriendCircle() {
      this.handleClosePopup();
      let formData = this.friendCircleSF.getFormData();
      this.handleChange('friendCircle', formData);
    },

    // 添加动态
    handleDynamic() {
      this.handleClosePopup();
      let formData = this.dynamicSF.getFormData();
      this.handleChange(formData.id ? 'editDynamic' : 'addDynamic', formData);
    },

    // 工具箱变更回调
    handleChange(change, data) {
      this.triggerEvent('change', { change, data });
    },

    // 关闭弹窗
    handleClosePopup() {
      delay(() => { hideAll(this); }, 500);
    },
  }
});
