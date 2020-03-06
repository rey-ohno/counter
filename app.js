const utils = require('utils')._;
const crypto = require('crypto');
const express = require('express');
const app = express();

const Datastore = require('nedb');
const db = new Datastore({
  filename: 'data/data.db',
  autoload: true,
});

const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

/**
 * カウンター情報取得処理
 */
app.get('/init.json', function(req, res, next) {
  const key = req.query.key;
  db.find({ 'key': key }).sort({ id: 1 }).exec(function(err, data) {
    res.json(data);
  });
});

/**
 * カウンター表示処理
 */
app.get('/', function(req, res, next) {
  let key = req.query.key;
  if (utils.isEmpty(key)) {
    key = require('crypto').randomBytes(256).toString('hex');
    const md5 = crypto.createHash('md5');
    const md5key = md5.update(key, 'binary').digest('hex');
    res.redirect(req.baseUrl + '?key=' + md5key);
  } else {
    res.render('index', {});
  }
});

/**
 * (socket.io)
 */
io.on('connection', function(socket) {

  /**
   * カウンター変動時処理(socket.io)
   */
  socket.on('counter', function(msg) {
    const json = JSON.parse(msg);
    const obj = { 'key': json.key, 'id': json.id };
    db.find(obj).sort({ id: 1 }).exec(function(err, data) {
      if (data.length > 0) {
        let cnt = data[0].cnt;
        if (json.type === 'add') {
          cnt = cnt + 1;
        } else if (json.type === 'subtract') {
          cnt = cnt - 1;
        }
        db.update({ '_id': data[0]._id }, { $set: { 'cnt': cnt } },
          function(err, num) {
            const ret = {
              'key': json.key,
              'id': json.id,
              'label': json.label,
              'cnt': cnt,
            };
            io.emit('counter', JSON.stringify(ret));
          });
      }
    });
  });

  /**
   * カウンター追加時処理(socket.io)
   */
  socket.on('add', function(msg) {
    const json = JSON.parse(msg);
    db.insert({
      'key': json.key,
      'id': json.id + '',
      'label': json.label,
      'cnt': 0,
    });
    io.emit('add', JSON.stringify(json));
  });

  /**
   * カウンター削除時処理(socket.io)
   */
  socket.on('del', function(msg) {
    const json = JSON.parse(msg);
    db.remove({ 'key': json.key, 'id': String(json.id) }, { multi: true },
      function(err, numRemoved) {
        io.emit('del', JSON.stringify(json));
      });
  });

  /**
   * カウンターリセット時処理(socket.io)
   */
  socket.on('reset', function(msg) {
    const json = JSON.parse(msg);
    db.update({ 'key': json.key }, { $set: { 'cnt': 0 } }, { multi: true },
      function(err, numReplaced) {
        db.find({ key: json.key }).sort({ id: 1 }).exec(function(err, data) {
          const ret = {};
          ret.key = json.key;
          ret.list = data;
          io.emit('reset', JSON.stringify(ret));
        });
      });
  });

  /**
   * カウンターラベル変更時処理(socket.io)
   */
  socket.on('rename', function(msg) {
    const json = JSON.parse(msg);
    db.update({ 'key': json.key, 'id': String(json.id) }, { $set: { 'label': json.label } },
      function(err, numReplaced) {
        db.find({ key: json.key, 'id': String(json.id) }).sort({ id: 1 }).exec(function(err, data) {
          if (data.length > 0) {
            const ret = {
              'key': data[0].key,
              'id': data[0].id,
              'label': data[0].label,
            };
            io.emit('rename', JSON.stringify(ret));
          }
        });
      });
  });
});

http.listen(PORT, function() {
  console.log('Node.js is listening to PORT:' + PORT);
});