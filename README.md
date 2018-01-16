# Padavan client
一个运行于[JSBox](https://itunes.apple.com/app/id1312014438)的Padavan微客户端

#### 简介
实现简单管理功能  
目前仅支持查看系统信息及在线设备列表  
<img width="240" height="426" src="https://raw.githubusercontent.com/c7i/padavan-client-jsbox/master/screenshots/index.jpg"></img>
<img width="240" height="426" src="https://raw.githubusercontent.com/c7i/padavan-client-jsbox/master/screenshots/config.jpg"></img>

#### 安装说明
- 方法一：扫描二维码，在浏览器中打开  
![image](https://raw.githubusercontent.com/c7i/padavan-client-jsbox/master/screenshots/install.png)
- 方法二：打开[源代码](https://raw.githubusercontent.com/c7i/padavan-client-jsbox/master/Padavan.js)，手动复制（pin新版仅支持手动编写）

#### 更新日志
##### 2018-01-16  
- 增加设备连接记录功能，此功能需要配合scripts中的脚本使用，方法如下  
``1.将init.sh和deviced.sh给予执行权限; 2.把init.sh添加到系统的started_script.sh中; 3.将deviced.sh加入计划任务中``
