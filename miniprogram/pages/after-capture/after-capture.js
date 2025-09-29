import {
  dataset,
  toast
} from "../../utils/common";

// pages/after-capture/after-capture.js
Page({

  data: {
    unfixedImage: '',
    fixedImage: ''
  },

  onLoad: function (options) {

  },

  handleSelect() {
    wx.chooseMedia({
      count: 1,
      sizeType: ['original'],
    }).then((res) => {
      toast.loading();

      let path = res.tempFiles[0].tempFilePath;
      this.setData({
        unfixedImage: path
      })

      // 获取图片信息
      wx.getImageInfo({
        src: path,
        success: (imageInfo) => {
          const imgWidth = imageInfo.width;
          const imgHeight = imageInfo.height;

          // 创建离屏canvas
          const offscreenCanvas = wx.createOffscreenCanvas({
            type: '2d',
            width: imgWidth,
            height: imgHeight
          });

          const ctx = offscreenCanvas.getContext('2d');

          // 创建图片对象
          const img = offscreenCanvas.createImage();

          // 设置图片加载完成的回调
          img.onload = () => {
            // 绘制原图
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

            let ratio = wx.getSystemInfoSync().devicePixelRatio;
            const res = wx.getMenuButtonBoundingClientRect()
            let rectWidth = res.width * ratio;
            let rectHeight = res.height * ratio;
            let rectX = res.left * ratio;
            let rectY = res.top * ratio;
            ctx.fillStyle = '#ededed';
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

            // 从离屏canvas获取图像数据
            const dataURL = offscreenCanvas.toDataURL('image/png');
            const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');

            // 使用临时文件路径创建文件系统文件
            const fs = wx.getFileSystemManager();
            const tempPath = `${wx.env.USER_DATA_PATH}/temp_image_${Date.now()}.png`;

            fs.writeFile({
              filePath: tempPath,
              data: wx.base64ToArrayBuffer(base64Data),
              encoding: 'binary',
              success: () => {
                this.setData({
                  fixedImage: tempPath
                })
                toast.hide();
              },
              fail: (err) => {
                toast.fail('写入文件失败');
                console.error('写入文件失败', err);
              }
            });
          };

          // 设置图片源
          img.src = path;
        },
        fail: (err) => {
          toast.fail('获取图片信息失败');
          console.error('获取图片信息失败', err);
        }
      });
    }).catch((err) => {});
  },

  handleSave() {
    // 保存到相册
    wx.saveImageToPhotosAlbum({
      filePath: this.data.fixedImage,
      success: () => {
        toast.fail('保存成功');
        // 删除临时文件
        const fs = wx.getFileSystemManager();
        fs.unlink({
          filePath: this.data.fixedImage,
          fail: (err) => {
            console.error('删除临时文件失败', err);
          }
        });
      },
      fail: (err) => {
        toast.fail('保存失败');
        console.error('保存失败', err);
      }
    });
  },

  handlePreview(e) {
    wx.previewMedia({
      sources: [this.data.unfixedImage, this.data.fixedImage].map((mitem) => {
        return {
          url: mitem,
          type: 'image'
        }
      }),
      current: Number(dataset(e, 'index')),
    })
  },

  onShareAppMessage() {
    return sharePage();
  }
});