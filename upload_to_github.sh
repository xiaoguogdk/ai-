#!/bin/bash

echo "正在初始化Git仓库..."
git init

echo "添加远程仓库..."
git remote add origin https://github.com/xiaoguogdk/ai-.git

echo "添加所有文件..."
git add .

echo "提交更改..."
git commit -m "修复手机端响应式布局问题 - 优化移动端显示效果"

echo "推送到GitHub..."
git branch -M main
git push -u origin main

echo "上传完成！"
echo "访问地址: https://xiaoguogdk.github.io/ai-/"
