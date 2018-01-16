#!/bin/sh

# 创建custom文件夹
rm -rf /tmp/c7i/opt
mkdir -p /tmp/c7i/opt/share/www/custom
# 挂载到/opt目录
umount -lf /opt
mount --bind /tmp/c7i/opt /opt

# 自定义API请求目录
mkdir -p /etc/storage/c7i/custom
ln -sfn /etc/storage/c7i/custom /www/custom/c7i
# 设备连接记录
mkdir -p /tmp/c7i/deviced
ln -sfn /tmp/c7i/deviced /www/custom/c7i/deviced

