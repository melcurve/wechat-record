// components/ad-contact/ad-contact.js
import { toast } from "../../utils/common";
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    copy() {
      wx.setClipboardData({
        data: 'yifancn@hotmail.com',
      }).then(() => {
        wx.showModal({
          title: '恭喜',
          content: '您已成功复制陈先生的电子邮件！请即刻联系陈先生本人并进行合作洽谈和打钱！',
          confirmText: '好的',
          cancelText: '好的'
        });
      });
    }
  }
});
