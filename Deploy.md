# 部署到Heroku

### 一 使用Mlab代替本地数据库

    1. 注册
    [https://mlab.com/signup/](https://mlab.com/signup/)

    2. 创建新的数据库
    点击MongoDB Deployments 右侧的Create new
    选择plan中的single-node， 选择下方免费的Sandbox

    3. 创建数据库中的用户

    4. 使用url连接数据库
    在 [官方文档中的Language Center](http://docs.mlab.com/languages/)中详细讲解了各种语言应该如何使用Mlab
    其中nodejs的用法如下：
    `
        var mongodb = require('mongodb');

        var uri = 'mongodb://user:pass@host:port/db';

        mongodb.MongoClient.connect(uri, function(err, db) {});
    `

### 二 部署到Heroku
