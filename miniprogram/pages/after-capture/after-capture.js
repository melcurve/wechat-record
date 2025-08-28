// pages/after-capture/after-capture.js
Page({

  data: {

  },

  onLoad: function (options) {

  },

  handleSelect() {
    wx.chooseMedia({
      count: 1,
      sizeType: ['original'],
    }).then((res) => {
      let path = res.tempFiles[0].tempFilePath;

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
                // 保存到相册
                wx.saveImageToPhotosAlbum({
                  filePath: tempPath,
                  success: () => {
                    wx.showToast({
                      title: '保存成功',
                      icon: 'success'
                    });
                    // 删除临时文件
                    fs.unlink({
                      filePath: tempPath,
                      fail: (err) => {
                        console.error('删除临时文件失败', err);
                      }
                    });
                  },
                  fail: (err) => {
                    console.error('保存失败', err);
                    wx.showToast({
                      title: '保存失败',
                      icon: 'none'
                    });
                  }
                });
              },
              fail: (err) => {
                console.error('写入文件失败', err);
              }
            });
          };

          // 设置图片源
          img.src = path;
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
        }
      });
    }).catch((err) => {
      console.error('选择图片失败', err);
    });
  },

  onShareAppMessage() {
    return sharePage();
  }
});