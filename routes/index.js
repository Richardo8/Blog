var express = require('express');
var router = express.Router();

var crypto = require('crypto'),
    User = require('../modules/user.js'),
    Post = require('../modules/post.js'),
    Comment = require('../modules/comment.js')
    multer = require('multer');

var upload = multer({
  dest: './public/images/user'
})

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

module.exports = function (app) {
  app.get('/', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTen(null, page, function (err, posts, total) {
      if(err){
        posts = [];
      }
      res.render('index.ejs', {
        title: '主页',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
    // Post.getAll(null, function (err, posts) {
    //   if(err){
    //     posts = [];
    //   }
    //   res.render('index', {
    //     title: '主页',
    //     user: req.session.user,
    //     posts: posts,
    //     success: req.flash('success').toString(),
    //     error: req.flash('error').toString()
    //   })
    // })
  });
  app.get('/reg', checkNotLogin)
  app.get('/reg', function (req, res) {
    res.render('reg.ejs', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    })
  });
  app.post('/reg', checkNotLogin)
  app.post('/reg', function (req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    if(password_re != password){
      req.flash('error', '两次输入的密码不一致！');
      return res.redirect('/reg')
    }
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    User.get(newUser.name, function (err, user) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      if(user){
        req.flash('error', '用户已存在');
        return res.redirect('/reg');
      }
      newUser.save(function (err, user) {
        if(err){
          req.flash('error', err);
          return res.redirect('/reg');
        }
        req.session.user = user;
        req.flash('success', '注册成功');
        res.redirect('/');
      })
    })
  });
  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login.ejs', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    })
  });
  app.post('/login', checkNotLogin)
  app.post('/login', function (req, res) {
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function (err, user) {
      if(!user){
        req.flash('error', '用户不存在');
        return res.redirect('/login');
      }

      if(user.password !=password) {
        req.flash('error', '密码错误');
        return res.redirect('/login');
      }

      req.session.user = user;
      req.flash('success', '登陆成功');
      res.redirect('/')
    })
  });
  app.get('/post', checkLogin)
  app.get('/post', function (req, res) {
    res.render('post.ejs', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    })
  });
  app.post('/post', checkLogin)
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3]
        post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
    post.save(function (err) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success', '发表成功');
      res.redirect('/');
    })
  });
  app.get('/logout', checkLogin)
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/')
  });
  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload.ejs', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  //最新的multer中上传文件格式如下 原来的方法会抛出app.use() requires middleware functions错误
  app.post('/upload', upload.fields([
  {name: 'file1'},
  {name: 'file2'},
  {name: 'file3'},
  {name: 'file4'},
  {name: 'file5'}
  ]), function (req, res, next) {
    for(var i in req.files){
      console.log(req.files[i]);
    }
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  app.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
      if(err){
        req.flash('error', err);
        return res.redirect('/')
      }
      res.render('archive.ejs', {
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  });

  app.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tags.ejs', {
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tag.ejs', {
        title: 'Tag' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  });

  app.get('/links', function (req, res) {
    res.render('links.ejs', {
      title: '友情链接',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    })
  })

  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('search.ejs', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  });

  app.get('/u/:name', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    User.get(req.params.name, function (err, user) {
      if(!user){
        req.flash('error', '用户不存在');
        return res.redirect('/');
      }
      Post.getTen(user.name, page, function (err, posts, total) {
        if(err){
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user.ejs', {
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        })
      })
    })
  })

  app.get('/p/:_id', function (req, res) {
    Post.getOne(req.params._id, function (err, post) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article.ejs', {
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if(err){
        req.flash('error', err);
        return res.redirect('back');
      }
      res.render('edit.ejs', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
      })
    })
  })

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if(err){
        req.flash('error', err);
        return res.redirect(url);
      }
      req.flash('success', '修改成功');
      res.redirect(url);
    })
  });

  app.get('/remove/:name/:day/:title', checkLogin)
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if(err){
        req.flash('error', err);
        return res.redirect('back')
      }
      req.flash('success', '删除成功');
      res.redirect('/')
    })
  });

  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
      if(err){
        req.flash('error', err);
        return res.redirect(back);
      }
      var currentUser = req.session.user,
          reprint_from = {
            name: post.name,
            day: post.time.day,
            title: post.title
          },
          reprint_to = {
            name: currentUser.name,
            head: currentUser.head
          };
      Post.reprint(reprint_from, reprint_to, function (err, post) {
        if(err){
          req.flash('error', err);
          return res.redirect('back');
        }
        req.flash('success', '转载成功');
        var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
        res.redirect(url);
      })
    })
  })

  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
      name: req.body.name,
      head: head,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if(err){
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '留言成功')
      res.redirect('back')
    })
  })
    
  app.get('/test', function (req, res) {
      res.render('test', {
          title: '编辑',
      })
  })

  app.use(function (req, res) {
    res.render('404')
  })

  //检测是否登录
  function checkLogin(req, res, next) {
    if(!req.session.user){
      req.flash('error', '未登录');
      res.redirect('/login')
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if(req.session.user){
      req.flash('error', '已登录');
      res.redirect('back');
    }
    next();
  }

};
