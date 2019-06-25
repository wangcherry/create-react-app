'use strict';
// git 仓库中的groupName，需配置
const group = 'shark';
// git 仓库中的productName，需配置
const product = 'react-template';
// 应用的contextPath，需配置，没有填空字符串
const contextPath = '/react-template';
// 开发时后端提供的链接
const remoteUrl = 'http://test.yx.mail.netease.com';

module.exports = {
  __dirname: __dirname,
  // 此处为端口号为 basePort， shark 会帮你自动选择可用的端口号
  port: 9000,
  // 组名
  group: group,
  // 项目名
  product: product,
  // 项目前缀
  contextPath: contextPath,
  // 是否兼容 IE9 及以上
  shimIE9: false,
  // 远端联调地址，一般是测试机的对外ip+服务端的端口。
  remote: {
    url: remoteUrl,
  },
  // 打包生成 index.html时插入的 CDN 前缀，此处需要与 shark-deploy 部署时提供的静态文件前缀保持一致
  mimgURLPrefix: {
    dev: `${contextPath}/`,
    test: `//nos.netease.com/mailpub-test/hxm/${group}/${product}/`,
    online: `//mailpub.nosdn.127.net/hxm/${group}/${product}/`, //mailpub桶支持cdn，与 nos.netease.com/mailpub/hxm 地址相同
  },
};
