var mongodb = require('mongodb');
markdown = require('markdown').markdown;
var ObjectID = require('mongodb').ObjectID;

var settings = require('../settings');

function Post(name, head, title, tags, post) {
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        data: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' +(date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var posts = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
        pv: 0
    }

    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.insert(posts, {
                safe: true
            }, function (err) {
                db.close();;
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}

Post.getTen = function (name, page, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            collection.count(query, function (err, total) {
                collection.find(query, {
                    skip: (page - 1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    db.close();;
                    if(err){
                        return callback(err);
                    }
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    })
                    callback(null, docs, total)
                })
            })
            //查找所有
            // collection.find(query).sort({
            //     time: -1
            // }).toArray(function (err, docs) {
            //     db.close();;
            //     if(err){
            //         return callback(err);
            //     }
            //     docs.forEach(function (doc) {
            //         doc.post = markdown.toHTML(doc.post)
            //     })
            //     callback(null, docs);
            // })
        })
    })
}

Post.getOne = function (_id, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.findOne({
                // "name": name,
                // "time.day": day,
                // "title": title
                "_id": new ObjectID(_id)
            }, function (err, doc) {
                if(err){
                    db.close();;
                    return callback(err);
                }
                // doc.post = markdown.toHTML(doc.post)
                //让留言也支持markdown
                if(doc){
                    collection.update({
                        // "name": name,
                        // "time.day": day,
                        // "title": title
                        "_id": new ObjectID(_id)
                    }, {
                        $inc: {"pv" : 1}
                    }, function (err) {
                        db.close();;
                        if(err){
                            return callback(err);
                        }
                    })
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    })
                }
                callback(null, doc)
            })
        })
    })
};

Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null, doc)
            })
        })
    })
}

Post.update = function (name, day, title, post, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            }, function (err) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

Post.remove = function (name, day, title, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.findOne({
                'name': name,
                'time.day': day,
                'title': title
            }, function (err, doc) {
                if(err){
                    db.close();;
                    return callback(err);
                }
                var reprint_from = '';
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != ''){
                    collection.update({
                        'name': reprint_from.name,
                        'time.day': reprint_from.day,
                        'title': reprint_from.title
                    }, {
                        $pill: {
                            'reprint_info.reprint_to': {
                                'name': name,
                                'day': day,
                                'title': title
                                }
                            }
                        }, function (err) {
                        if(err){
                            db.close();;
                            return callback(err);
                        }
                        }
                    )
                }
            })
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function (err) {
                db.close();;
                if(err){
                    return callback(err)
                }
                callback(null);
            })
        })
    })
}

Post.getArchive = function (callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            })
        })
    })
}

Post.getTags = function (callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.distinct('tags', function (err, docs) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            })
        })
    })
}

Post.getTag = function (tag, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            })
        })
    })
};

Post.search = function (keyword, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            var pattern = new RegExp(keyword, 'i');
            collection.find({
                'title': pattern
            }, {
                'name': 1,
                'time': 1,
                'title': 1
            }).toArray(function (err, docs) {
                db.close();;
                if(err){
                    return callback(err);
                }
                callback(null, docs)
            })
        })
    })
}

Post.reprint = function (reprint_from, reprint_to, callback) {
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                db.close();;
                return callback(err);
            }
            collection.findOne({
                'name': reprint_from.name,
                'time.day': reprint_from.day,
                'title': reprint_from.title
            }, function (err, doc) {
                if (err) {
                    db.close();;
                    return callback(err);
                }
                var date = new Date();
                var time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                    date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                }
                delete doc._id;
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (reprint_from.title.search(/[转载]/) > -1) ? reprint_from.title : "[转载]" + reprint_from.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                collection.update({
                    'name': reprint_from.name,
                    'time.day': reprint_from.day,
                    'title': reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day": time.day,
                            "title": doc.title
                        }
                    }
                }, function (err) {
                    if (err) {
                        db.close();;
                        return callback(err);
                    }
                });

                collection.insert(doc, {
                    safe: true
                }, function (err, post) {
                    db.close();;
                    if (err) {
                        return callback(err);
                    }
                    callback(err, post.ops[0])
                })
            })
        })
    })
}