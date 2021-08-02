// common.js
import { clearFlag } from "./config";
import { hexMD5 } from "./md5";
import { format } from 'date-fns';
import { themeList } from "../assets/theme";
const dateFormat = format;

let app, version, config;
export const onLaunchAction = (_app, _config) => {
  app = _app;
  config = _config;
  initGlobal();
  setTheme();
  setDevice();
  handleStorage();
  handleUpdate();
  onUserCaptureScreen();
};

export const onUserCaptureScreen = () => {
  wx.onUserCaptureScreen(function (res) {
    delay(() => {
      to('/pages/after-capture/after-capture');
    }, 1000);
  });
};

/**
 * 更新小程序
 */
export const handleUpdate = () => {
  const updateManager = wx.getUpdateManager();
  updateManager.onUpdateReady(function () {
    updateManager.applyUpdate();
  });
};

/**
 * 缓存相关
 */
export const handleStorage = () => {
  let _version = wx.getStorageSync("VERSION");
  let accountInfo = wx.getAccountInfoSync();
  version = accountInfo.miniProgram.version || '';
  // 如果clearFlag为true并且当前版本号不等于缓存版本号，则清除一下缓存
  if (clearFlag && _version && _version != version) resetStorage();
  else setConstStorage();
};

/**
 * 设置缓存
 */
export const setConstStorage = () => {
  wx.setStorageSync("VERSION", version);
};

/**
 * 重置缓存
 */
export const resetStorage = (keepPage) => {
  wx.clearStorageSync();
  setConstStorage();
  if (!keepPage) to("/pages/index/index", "reLaunch");
};

/**
 * 设置设备信息
 */
export const setDevice = () => {
  let device = {
    ios: false,
    bezelLess: false,
    wxwork: false,
  };
  // 设置基本信息
  let systemInfo = wx.getSystemInfoSync();
  device = Object.assign(systemInfo, device);
  device.SBH = systemInfo.statusBarHeight;
  device.STBH = `${device.SBH}px + 88rpx`;
  if (systemInfo.environment && systemInfo.environment == "wxwork") {
    device.wxwork = true;
  }
  if (systemInfo.platform == "ios" || systemInfo.platform == "devtools") {
    device.ios = true;
  }
  if (systemInfo.safeArea && systemInfo.safeArea.top > 32) {
    device.bezelLess = true;
  }
  // 获取网络状态
  wx.getNetworkType({
    success(res) {
      device.networkType = res.networkType;
    },
  });
  // 监听网络状态
  wx.onNetworkStatusChange(function (res) {
    device.networkType = res.networkType;
  });
  // 设置device
  app.globalData.device = device;
};

/**
 * 设置主题
 */
export const setTheme = (theme) => {
  let refreshFlag = false;
  if (theme) refreshFlag = true;
  else theme = wx.getStorageSync('THEME') || 'defaultTheme';
  app.globalData.theme = {
    key: theme,
    data: themeList[theme],
  };
  refreshThemeStorage(refreshFlag);
};

/**
 * 刷新主题缓存
 */
export const refreshThemeStorage = (reLaunch) => {
  wx.setStorageSync('THEME', app.globalData.theme.key);
  // if (reLaunch) {
  //   to('/pages/index/index', 'reLaunch');
  // }
};

/**
 * 初始化全局变量
 */
export const initGlobal = () => {
  // 设置globalData
  app.globalData = {
    dayMill: 86400000,
  };
};

export const reload = () => {
  let pages = getCurrentPages();
  let currentPage = pages[pages.length - 1];
  let url = currentPage.route;
  let options = currentPage.options;
  let param = [];
  if (options && options != "") {
    for (let key in options) {
      let _key = key;
      param.push(_key + "=" + options[_key]);
    }
  }
  let reLoadLink = "/" + url + "?" + param.join("&");
  to(reLoadLink, "redirectTo");
};

/**
 * 跳转到页面，自动识别switchTab和navigateTo
 * @param {string} url 跳转地址
 * @param {string} type 跳转类型，对应小程序路由文档
 */
export const to = (url, type) => {
  const handleNavigateTo = () => {
    wx.navigateTo({
      url,
      fail(res) {
        handleError(res);
      },
    });
  };
  const handleRedirectTo = () => {
    wx.redirectTo({
      url,
      fail(res) {
        handleError(res);
      },
    });
  };
  const handleSwitchTab = () => {
    if (url.indexOf("?") != -1) {
      url = url.split("?")[0];
    }
    wx.switchTab({
      url,
      fail(res) {
        handleError(res);
      },
    });
  };
  const handleError = (res) => {
    if (res.errMsg.indexOf("fail") != -1) {
      if (res.errMsg.indexOf("navigateTo") != -1 || res.errMsg.indexOf("redirectTo") != -1) {
        handleSwitchTab();
      } else if (res.errMsg.indexOf("switchTab") != -1) {
        handleNavigateTo();
      } else {
        error(res.errMsg);
        return;
      }
    } else {
      error(res.errMsg);
      return;
    }
  };
  if (type) {
    switch (type) {
      case "switchTab":
        handleSwitchTab();
        break;
      case "reLaunch":
        wx.reLaunch({
          url,
        });
        break;
      case "redirectTo":
        handleRedirectTo();
        break;
      case "navigateTo":
        handleNavigateTo();
        break;
      default:
        handleNavigateTo();
        break;
    }
  } else {
    handleNavigateTo();
  }
};

/**
 * 获取e.currentTarget.dataset
 * @param {object} e event对象
 * @param {string} name data-名称
 */
export const dataset = (e, name) => {
  let value = e.currentTarget.dataset[name];
  if (value || value == 0) {
    return value;
  } else {
    return "";
  }
};

/**
 * 模拟event对象结构
 * @param {object} dataset dataset内容
 */
export const fakeEvent = (dataset) => {
  return {
    currentTarget: {
      dataset,
    },
  };
};

/**
 * 隐藏页面所有弹窗和遮罩(即把页面所有包含$show的data参数设置为false)
 * @param {*} _this 页面的this对象
 * @callback callback setData完成后回调
 */
export const hideAll = (_this, callback) => {
  let keys = {};
  for (let key in _this.data) {
    if (key.indexOf("$") != -1) {
      if (_this.data[key] || _this.data[key] === 0) {
        keys[key] = false;
      }
    }
  }
  _this.setData(keys, () => {
    if (callback) callback();
  });
};

/**
 * wx.showToast和wx.showLoading封装，直接toast.xxx(config)即可使用
 * config可以是字符串也可以是wx.showToast的设置
 * 此封装主要是提供符合业务的默认参数设置
 */
export const toast = {
  success: (config) => {
    wx.showToast(toast.handleConfig(config, "success"));
  },
  fail: (config) => {
    wx.showToast(toast.handleConfig(config, "fail"));
  },
  loading: (config) => {
    wx.showLoading(toast.handleConfig(config, "loading"));
  },
  hide: () => {
    wx.hideToast();
    wx.hideLoading();
  },
  handleConfig: (config, type) => {
    let defaultData;
    let returnData = {
      title: null,
      icon: null,
      mask: null,
      duration: null,
    };
    switch (type) {
      case "success":
        defaultData = {
          title: "操作成功",
          icon: "success",
          mask: false,
          duration: 1500,
        };
        break;
      case "fail":
        defaultData = {
          title: "操作失败",
          icon: "none",
          mask: false,
          duration: 1500,
        };
        break;
      case "loading":
        defaultData = {
          title: "请稍等",
          mask: true,
        };
        break;
    }
    returnData = defaultData;
    if (config) {
      if (typeof config == "string") {
        returnData.title = config;
      } else {
        for (let key in returnData) {
          if (config[key]) {
            returnData[key] = config[key];
          }
        }
      }
    }
    return returnData;
  },
};

/**
 * wx.showModal的封装
 */
export const modal = {
  /**
   * 数据收取失败后的弹窗
   * @param {object} _this 页面的this对象，点击确定将会调用页面的onLoad方法
   * @param {string} msg 弹窗提示错误文案
   */
  fetchError: (_this, msg) => {
    wx.showModal({
      title: "请求错误",
      content: msg || "请重新加载",
      confirmText: "重新加载",
      cancelText: "取消",
    }).then((res) => {
      if (res.confirm) {
        if (_this) {
          _this.onLoad();
        } else {
          wx.startPullDownRefresh();
        }
      }
    });
  },
};

/**
 * 检测手机号
 * @param {*} phone 手机号
 * @return 返回布尔值
 */
export const isPhone = (phone) => {
  return /^1[3456789]\d{9}$/.test(phone);
};

/**
 * 检测是否只包含中英文数字
 * @param {*} string 字符串
 * @return 返回布尔值
 */
export const hasSymbol = (string) => {
  return /[^\a-\z\A-\Z0-9\u4E00-\u9FA5]/.test(string);
};

/**
 * 字符串替换
 */
export const replaceString = (string, start, end, all, newString) => {
  let replaceWord = string.slice(start, end);
  let newWord = "";
  if (typeof newString == "function") {
    newWord = newString(replaceWord);
  } else {
    newWord = newString;
  }
  if (all) {
    replaceWord = string.replace(new RegExp(replaceWord, "g"), newWord);
  } else {
    replaceWord = string.replace(replaceWord, newWord);
  }
  return replaceWord;
};

/**
 * 格式化时间
 * @param {*} date 日期对象,可以是日期字符串
 * @param {*} mark 分隔符号,不传则为'/'
 * @param {number} type 类型 0 年月日 1 时分秒 2 时分 3 中文年月日 4 中文月日 5 中文年月 6 年月日时分秒
 * @return 返回字符串
 */
export const formatTime = (date, mark, type) => {
  if (!isNaN(Number(date))) {
    date = new Date(Number(date));
  } else if (typeof date == "string") {
    date = new Date(date.replace(/-/g, "/").replace(/\./g, "/").substr(0, 19));
  }
  if (typeof date == "object") {
    const year = date.getFullYear();
    const month = fixNumber(date.getMonth() + 1, 2);
    const day = fixNumber(date.getDate(), 2);
    const hour = fixNumber(date.getHours(), 2);
    const minute = fixNumber(date.getMinutes(), 2);
    const second = fixNumber(date.getSeconds(), 2);
    if (!mark) {
      mark = "/";
    }
    switch (type) {
      case 0:
        return [year, month, day].map(fixNumber).join(mark);
      case 1:
        return [hour, minute, second].map(fixNumber).join(mark);
      case 2:
        return [hour, minute].map(fixNumber).join(mark);
      case 3:
        return year + "年" + month + "月" + day + "日";
      case 4:
        return month + "月" + day + "日";
      case 5:
        return year + "年" + month + "月";
      case 6:
        return [year, month, day].map(fixNumber).join(mark) + " " + [hour, minute, second].map(fixNumber).join(":");
    }
  } else {
    return null;
  }
};

/**
 * 数字补0
 * @param {number} number 数字
 * @param {*} length 返回的长度
 * @return 返回
 */
export const fixNumber = (number, length) => {
  if (!isNaN(number)) {
    if (!length) length = 2;
    let len = number.toString().length;
    while (len < length) {
      number = "0" + number;
      len++;
    }
    return number;
  } else {
    return "";
  }
};

/**
 * 页面转发操作
 * @param {string} title 转发标题
 * @param {string} imageUrl 转发图片，PNG/JPG，5:4
 * @param {string} path 转发路径，必须以/开头
 */
export const sharePage = (title, imageUrl, path) => {
  return {
    title: title == "orignal" ? null : title || '干神么鸭嘎嘎嘎',
    path: path || "/pages/index/index",
    imageUrl: imageUrl == "orignal" ? null : imageUrl || '/images/share.png',
  };
};

export const getImgInfo = (url) => {
  let info = [0, 0];
  if (url && typeof url == "string" && url.indexOf("size=") != -1) {
    let size = url.split("size=")[1].split("x");
    info = [Number(size[0]), Number(size[1])];
  }
  return info;
};

/**
 * 深拷贝
 * @param {object} target 对象
 */
export const deepClone = (target) => {
  let result;
  if (typeof target === "object") {
    if (Array.isArray(target)) {
      result = [];
      for (let i in target) {
        result.push(deepClone(target[i]));
      }
    } else if (target === null) {
      result = null;
    } else if (target.constructor === RegExp) {
      result = target;
    } else {
      result = {};
      for (let i in target) {
        result[i] = deepClone(target[i]);
      }
    }
  } else {
    result = target;
  }
  return result;
};

/**
 * 判断页面是否滚动到顶部并setData对应值
 * @param {object} _this 页面this对象
 * @param {object} event onPageScroll回调
 * @param {string} _param 需要setData的值，不传默认为onTop
 * @param {string} _offset 距离顶部距离，不传默认为10
 */
export const handleTop = (_this, event, _param, _offset, reverse) => {
  let param = _param || "onTop";
  let offset = _offset || 10;
  if ((!reverse && event.scrollTop > offset) || (reverse && event.scrollTop < offset)) {
    if (_this.data[param]) {
      _this.setData({
        [param]: false,
      });
    }
  } else {
    if (!_this.data[param]) {
      _this.setData({
        [param]: true,
      });
    }
  }
};

/**
 * 设置上一页的data
 * @param {string} key 上一页的键值
 * @param {*} data 要设置的data
 */
export const setPrevPageData = (key, data) => {
  var pages = getCurrentPages();
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    [key]: data,
  });
};

export const saveImage = (url) => {
  wx.getSetting({
    success: (res) => {
      if (!res.authSetting["scope.writePhotosAlbum"]) {
        wx.authorize({
          scope: "scope.writePhotosAlbum",
          success: () => {
            // 同意授权
            saveAction();
          },
          fail: (res) => {
            wx.showModal({
              confirmText: "去授权",
              content: "需要您授权相册权限才能保存图片",
              success(res) {
                if (res.confirm) {
                  wx.openSetting();
                }
              },
            });
          },
        });
      } else {
        // 已经授权了
        saveAction();
      }
    },
    fail: (res) => {
      toast.fail("保存失败，请重试");
    },
  });

  let saveAction = () => {
    wx.saveImageToPhotosAlbum({
      filePath: url,
      success: (_res) => {
        toast.fail("保存成功");
      },
      fail: (_res) => {
        if (_res.errMsg != "saveImageToPhotosAlbum:fail cancel") {
          toast.fail("保存失败，请重试");
        } else {
          toast.hide();
        }
      },
    });
  };
};

/**
 * 日期转中文
 * @param {} dateStr
 * @param {*} type // type 1 年月日 2 年月 3 年
 */
export const dateToCn = (dateStr, type) => {
  var dict = {
    "0": "零",
    "1": "一",
    "2": "二",
    "3": "三",
    "4": "四",
    "5": "五",
    "6": "六",
    "7": "七",
    "8": "八",
    "9": "九",
    "10": "十",
    "11": "十一",
    "12": "十二",
    "13": "十三",
    "14": "十四",
    "15": "十五",
    "16": "十六",
    "17": "十七",
    "18": "十八",
    "19": "十九",
    "20": "二十",
    "21": "二十一",
    "22": "二十二",
    "23": "二十三",
    "24": "二十四",
    "25": "二十五",
    "26": "二十六",
    "27": "二十七",
    "28": "二十八",
    "29": "二十九",
    "30": "三十",
    "31": "三十一",
  };
  if (typeof dateStr == "object") {
    dateStr = dateStr.getFullYear() + "-" + (dateStr.getMonth() + 1) + "-" + dateStr.getDate();
  }
  var date = dateStr.split("-"),
    yy = date[0],
    mm = date[1],
    dd = date[2];
  var yearStr = dict[yy[0]] + dict[yy[1]] + dict[yy[2]] + dict[yy[3]] + "年",
    monthStr = dict["" + Number(mm)] + "月",
    dayStr = dict[dd] + "日";
  if (type == 1) {
    return yearStr + monthStr + dayStr;
  } else if (type == 2) {
    return yearStr + monthStr;
  } else if (type == 3) {
    return yearStr;
  }
};

/**
 * 取随机数
 * @param {number} min 最小数（包含）
 * @param {number} max 最大数（包含）
 */
export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 判断是否有值（包含0）
 * @param value 值
 * @param type 判断类型 0 默认判断 1 是否为数组 2 是否为对象 3 是否为JSON
 */
export function valid(value, type) {
  // 普通判断
  if (typeof value == 'boolean') return true;
  else if (!value && value !== 0) return false;
  else if (!type) return true;
  // 数组判断
  if (type === 1) return Boolean((value instanceof Array) && value.length);
  // 对象判断
  if (type === 2) return Boolean((value instanceof Object) && Object.keys(value).length > 0);
  // JSON判断
  if (type === 3) return isJSON(value);
};

/**
 * 获取Enum数据
 * @param list 数组
 * @param type 类型 0 自定义label和value 1 label和value为本身 2 value为数组下标 3 value为数组下标(从1开始计数)
 * @param label enum.label参数名
 * @param value enum.value参数名
 * @param emptyItem 是否添加"未选择"项，传string可自定义文本
 * @param filter 过滤条件
 */
export function getEnum(list, type, emptyItem, label, value, filter) {
  let fixedList = [];
  if (emptyItem) {
    fixedList.push({
      label: typeof emptyItem == 'string' ? emptyItem : '未选择',
      value: '',
    });
  }
  list.map((item, index) => {
    let pushLabel;
    let pushValue;
    switch (type) {
      case 0:
        pushLabel = item[label];
        pushValue = item[value] || item[value] === 0 ? item[value] : '-';
        break;
      case 1:
        pushLabel = pushValue = item;
        break;
      case 2:
        pushLabel = item;
        pushValue = index;
        break;
      case 3:
        pushLabel = item;
        pushValue = index + 1;
        break;
    }
    if ((filter && filter(item, index)) || !filter) {
      fixedList.push({
        label: pushLabel,
        value: pushValue,
      });
    }
  });
  return fixedList;
};

/**
 * 获取Enum数据的值的名称
 * @param list 数组
 * @param type 类型 0 自定义label和value 1 label和value为本身 2 value为数组下标 3 value为数组下标(从1开始计数)
 * @param resValue 数据值
 * @param label enum.label参数名
 * @param value enum.value参数名
 */
export function getEnumValue(list, type, resValue, label, value) {
  let returnValue = '-';
  list.map((item, index) => {
    let pushLabel;
    let pushValue;
    switch (type) {
      case 0:
        pushLabel = item[label];
        pushValue = item[value];
        break;
      case 1:
        pushLabel = pushValue = item;
        break;
      case 2:
        pushLabel = item;
        pushValue = index;
        break;
      case 3:
        pushLabel = item;
        pushValue = index + 1;
        break;
    }
    if (pushValue === resValue || pushValue === Number(resValue)) {
      returnValue = pushLabel;
    }
  });
  return returnValue;
};

export function delay(callback, delay) {
  let t = setTimeout(() => {
    clearTimeout(t);
    callback();
  }, delay || 0);
}

export function wechatDate(date, time) {
  let returnDate = date;
  const handleDate = (fullDate) => {
    let weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    let nowDate = new Date();
    let _nowDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    let _fullDate = new Date(fullDate.substr(0, 10).replace(/-/g, '/'));
    // 返回时间
    if (_nowDate.getTime() == _fullDate.getTime()) return fullDate.substr(11, 5);
    // 返回昨天
    if (_nowDate.getTime() - 86400000 == _fullDate.getTime()) return '昨天';
    // 返回星期
    if (_nowDate.getTime() - (86400000 * 6) < _fullDate.getTime()) return weekDay[_fullDate.getDay()];
    // 返回日期
    else return `${_fullDate.getFullYear()}/${_fullDate.getMonth() + 1}/${_fullDate.getDate()}`;
  };

  if (date) date = date.replace(/-/g, '/');
  if (date && time) {
    returnDate = handleDate(`${date} ${time}`);
  }
  if (!date && time) returnDate = time;

  return returnDate;
}

export function getId() {
  let date = new Date().getTime();
  let num = randomNumber(20, 1000);
  let id = hexMD5(`${date + num}`);
  return id;
}

/**
 * 获取数字区间的随机数
 * @param min 最小值
 * @param max 最大值
 */
export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 刷新chatItem缓存
export function refreshChatItemStorage(chatList) {

  // 先遍历chatDetail缓存，如果chatDetail中的id不存在于chatList，则表示要删除此chatDetail
  let chatDetail = wx.getStorageSync('CHAT_DETAIL') || {};

  // 待删除的chatDetail id
  let deleteChatDetailList = [];

  if (!chatList.length) chatDetail = {};
  else {
    for (let key in chatDetail) {
      for (let i = 0; i < chatList.length; i++) {
        let citem = chatList[i];
        if (citem.id == key) break;
        else if (i === chatList.length - 1) deleteChatDetailList.push(key);
      }
    }
  }

  // 删除chatDetail
  deleteChatDetailList.map((key) => {
    delete chatDetail[key];
  });

  // 更新缓存
  wx.setStorageSync('CHAT_LIST', chatList);
  wx.setStorageSync('CHAT_DETAIL', chatDetail);

  isStorageLimit();
}

/** 判断chatList或者chatDetail缓存是否超过1M */
export function isStorageLimit() {
  const getSize = (string) => {
    return JSON.stringify(string).replace(/[^\x00-\xff]/g, 'xx').length;
  };

  let chatList = wx.getStorageSync('CHAT_LIST') || [];
  let chatDetail = wx.getStorageSync('CHAT_DETAIL') || {};

  if (getSize(chatList) >= 1024 || getSize(chatDetail) >= 1024) {
    wx.showModal({
      content: '本地缓存即将超过限制，如果您在使用过程遇到问题，可以尝试在工具箱内清空缓存',
      showCancel: false
    });
  }
}

/**
 * 格式化时间
 * @param date Date对象或者日期字符串
 * @param format 日期格式化，详见javascript Date.format
 * @returns 返回格式化后的日期字符串
 */
export function formatDate(date, format) {
  if (date) {
    if (typeof date == 'string') {
      let str = date.replace('.0', '').replace(/-/g, '/').substr(0, 19);
      if (str.length == 4) str = `${str}/01/01`;
      else if (str.length == 7) str = `${str}/01`;
      date = new Date(str);
    }
    return dateFormat(date, format);
  } else {
    return '';
  }
}

export function isInclude(value, include) {
  for (let i = 0; i < include.length; i++) {
    if (value === include[i]) {
      return true;
    }
  }
  return false;
}