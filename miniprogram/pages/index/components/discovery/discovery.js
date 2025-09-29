// pages/index/components/discovery/discovery.js
import { discoveryList } from "../../../../assets/discovery-list";
import { dataset, db, deepClone, to, toast } from "../../../../utils/common";
const app = getApp();
Component({
  properties: {},

  data: {
    $showToolBox: true,
    discoveryList: [],
    // 标题
    title: '',
    isWechatTheme: false,
  },

  lifetimes: {
    attached() {
      this.titleLabel = app.globalData.theme.data.tabList[2].name;
      this.setData({
        title: this.titleLabel,
        isWechatTheme: app.globalData.theme.key == 'wechatTheme',
      });

      // 获取toolBox组件对象
      this.toolBox = this.selectComponent('#toolBox');

      let showList = db.get('DISCOVERY_LIST') || {};

      this.getData(showList);

    }
  },

  methods: {

    // 获取数据
    getData(showList) {
      this.data.discoveryList = deepClone(discoveryList);
      this.data.discoveryList.map((item) => {
        if (showList.hasOwnProperty(item.id)) item.show = showList[`${item.id}`];
        else item.show = 1;
      });
      this.setData({ discoveryList: this.data.discoveryList }, () => this.refreshDiscoveryListStorage());
    },

    // 点击
    handleAction(e) {
      let item = dataset(e, 'item');
      if (item.action) {
        switch (item.action) {
          // case 'friend-circle': to('/subPack-a/pages/friend-circle/friend-circle'); break;
        }
      }
    },

    // 显示工具箱
    showToolBox() {
      this.setData({ $showToolBox: true });
    },

    // 工具箱变更回调
    handleToolBoxChange(e) {
      let change = e.detail.change;
      let data = e.detail.data;
      switch (change) {
        case 'discovery': this.handleDiscovery(data); break;
      }
    },

    // 设置发现页
    handleDiscovery(data) {
      for (let key in data) {
        data[key] = data[key] ? 1 : 0;
      }
      this.getData(data);
      toast.fail('设置成功');
    },

    // 刷新发现页缓存
    refreshDiscoveryListStorage() {
      let showList = {};
      this.data.discoveryList.map((item) => { showList[`${item.id}`] = item.show; });
      db.set('DISCOVERY_LIST', showList);
    },
  }
});
