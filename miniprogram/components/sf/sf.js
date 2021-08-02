// components/sf/sf.js
import { valid, dataset } from "../../utils/common";
Component({
  properties: {
    // 表单配置
    schema: {
      type: Object,
      value: {}
    }
  },

  data: {
    // 历史文本
    historyList: [],
    // 是否显示历史文本弹窗
    $showHistoryPopup: false,
    // 是否已初始化过第一次
    hasInit: false
  },

  lifetimes: {
    attached() {
      this.handleHistoryText();
      this.handleInitValue().then(() => { this.change(); });
    },
  },

  methods: {
    // 从缓存中获取历史文本
    handleHistoryText() {
      const chatList = wx.getStorageSync('CHAT_LIST') || [];
      const chatDetail = wx.getStorageSync('CHAT_DETAIL') || {};
      const historyList = [];
      chatList.map((item) => {
        if (item.name) historyList.push(item.name);
        if (item.content) historyList.push(item.content);
      });
      for (let key in chatDetail) {
        let item = chatDetail[key].record;
        item.map((ritem) => {
          if (ritem.name) historyList.push(ritem.name);
          if (ritem.text) historyList.push(ritem.text);
        });
      }
      this.setData({
        historyList: [...new Set(historyList)],
      });
    },

    // 选择历史图片中的文本
    handleSelectHistory(e) {
      let key = dataset(e, 'key');
      let value = this.data.historyList[e.detail.value];
      this.setData({
        [`schema.${key}.value`]: value
      });
    },

    // 初始化表单值，比如下拉/单选/多选等需要额外处理才能正常显示
    handleInitValue() {
      return new Promise((resolve) => {
        let schema = this.data.schema;
        if (schema) {
          for (let key in schema) {
            let item = schema[key];

            // 如果有默认值default则将默认值赋值给value(仅第一次初始化有效)
            if (!valid(item.value) && valid(item.default) && !this.data.hasInit) { item.value = item.default; }

            if (valid(item.value) && item.enum) {
              // 处理下拉selector value
              if (item.type == 'selector') {
                let enumItemIndex = item.enum.findIndex((eitem) => eitem.value == item.value);
                let enumItem = item.enum.find((eitem) => eitem.value == item.value);
                if (valid(enumItemIndex) && enumItemIndex != -1) {
                  item.pickerValue = enumItemIndex;
                  item.pickerLabel = enumItem.label;
                }
              }
              // 处理单选value
              if (item.type == 'radio') {
                let enumItem = item.enum.find((eitem) => eitem.value == item.value);
                item.enum.map((eitem) => eitem.checked = false);
                if (enumItem) {
                  enumItem.checked = true;
                }
              }
              // 处理多选value
              if (item.type == 'checkbox') {
                if (typeof item.value != 'object') item.value = [item.value];
                item.enum.map((eitem) => eitem.checked = false);
                item.value.map((vitem) => {
                  let enumItem = item.enum.find((eitem) => eitem.value == vitem);
                  if (enumItem) enumItem.checked = true;
                });
              }
            }
          }
          this.setData({ schema, hasInit: true }, () => { this.handleVisible(); resolve(); });
        }
      });
    },

    // 判断表单项的visibleIf
    handleVisible() {
      let schema = this.data.schema;

      // 遍历表单项
      for (let key in schema) {
        let item = schema[key];

        // 如果存在visibleIf，则需要判断是否符合显示条件，否则直接显示
        if (item.hasOwnProperty('visibleIf')) {
          let visible = false;

          // 如果visibleIf为一个方法，则直接运行这个方法
          if (typeof item.visibleIf == 'function') {
            visible = item.visibleIf();
          } else {
            // 如果是一个对象，则遍历visibleIf对象
            for (let vkey in item.visibleIf) {
              let vitem = item.visibleIf[vkey];

              // 如果表单项中不存在此key则返回错误
              if (!schema.hasOwnProperty(vkey)) { console.error(`找不到key:${vkey}`); return; }

              // 如果visibleIf中的对象值为一个方法，则直接运行这个方法
              if (typeof vitem == 'function') {
                visible = vitem(schema[vkey].value);
              } else {

                // 否则遍历数组，如果表单对应的值符合其中一个条件则显示
                if (typeof vitem != 'object') vitem = [vitem];
                vitem.map((vvitem) => {
                  if (schema[vkey].value === vvitem) visible = true;
                });
              }
            }
          }
          item._show = visible;
        } else {
          item._show = true;
        }
      }
      this.setData({ schema });
    },

    // 设置表单值
    setFormData(data) {
      let schema = this.data.schema;
      for (let key in data) {
        if (schema[key]) schema[key].value = data[key];
      }
      this.setData({ schema }, () => { this.change(); this.handleInitValue(); });
    },

    // 清空表单值
    clearFormData(ignoreDefault) {
      let schema = this.data.schema;
      for (let key in schema) {
        let item = schema[key];
        item.value = !ignoreDefault && valid(item.default) ? item.default : null;
      }
      this.setData({ schema }, () => { this.change(); this.handleInitValue(); });
    },

    // 表单项变更后更新值
    handleValue(e) {
      let key = dataset(e, 'key');
      let value = e.detail.value;
      if (this.data.schema[key].type == 'selector') {
        let item = this.data.schema[key].enum[value];
        value = item.value;
        this.setData({
          [`schema.${key}.pickerLabel`]: item.label,
          [`schema.${key}.pickerValue`]: e.detail.value,
        });
      }
      this.setData({
        [`schema.${key}.value`]: value
      }, () => { this.change(key, value); this.handleInitValue(); });
    },

    // 表单变更回调
    change(key, value) {
      let formData = this.getFormData();
      this.triggerEvent('change', { key, value, formData });
    },

    // 获取表单值
    getFormData() {
      let data = {};
      for (let key in this.data.schema) {
        let item = this.data.schema[key];
        if (valid(item.value)) data[key] = item.value;
      }
      return data;
    },
  }
});
