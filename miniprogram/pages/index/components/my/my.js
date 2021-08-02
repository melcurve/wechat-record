// pages/index/components/my/my.js
import { themeList } from "../../../../assets/theme";
import { dataset, delay, setTheme, to, toast } from "../../../../utils/common";
const app = getApp();
Component({
  properties: {

  },

  data: {
    // 标题
    title: '',
    // 主题列表
    themeList,
  },

  lifetimes: {
    attached() {
      this.titleLabel = app.globalData.theme.data.tabList[3].name;
      this.setData({ title: this.titleLabel });

      this.handleActive();
    }
  },

  methods: {
    handleActive(key) {
      if (!key) key = app.globalData.theme.key;
      for (let _key in this.data.themeList) {
        let item = this.data.themeList[_key];
        if (_key == key) {
          item.active = true;
        } else {
          item.active = false;
        }
      }
      this.setData({ themeList: this.data.themeList });
    },
    handleChangeTheme(e) {
      let key = dataset(e, 'key');
      this.handleActive(key);
      setTheme(key);
      toast.loading();
      delay(() => {
        toast.hide();
        wx.showModal({
          title: '切换主题成功',
          content: '重启小程序后生效',
          showCancel: false,
          confirmText: '立即重启',
        }).then(() => {
          to('/pages/index/index', 'reLaunch');
        });
      }, 500);
    }
  }
});
