var express = require('express'),
    app = express(),
    path = require('path'),
    validUrl = require('valid-url'),
    MongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID,
    urli = 'mongodb://' + process.env.DB_LOGIN + ':' + process.env.DB_PASS + '@ds113580.mlab.com:13580/freecodecamp_1';

// Listen port
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

// Include home page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Search for a shortened URL
app.get('/:query', function(req, res) {
    var id = req.params.query.toString();
    var findDocuments = function(db, callback) {
        var collection = db.collection('users');
        collection.find({'_id' : id}).toArray(function (err, docs) {
            if (err) errorMess("Unable to connect", res);
            if (docs && docs.length) res.redirect(docs[0].url);
            else errorMess("Invalid Short URL", res);
            callback(docs);
        });
    };
    MongoClient.connect(urli, function(err, db) {
        if (err) errorMess("Unable to connect", res);
        console.log("Connected!");
        findDocuments(db, function() {
            db.close();
        });
    });
});

// Create a new shortened URL
app.get('/new/*?', function(req, res) {
    var url = req.params[0];
    if (url && validUrl.isUri(url)) {
        var findDocuments = function(url, db, callback) {
            var collection = db.collection('users');
            collection.find({'url': url}).toArray(function(err, docs) {
                if (err) errorMess("Unable to connect", res);
                if (!docs.length) {
                    var key = ObjectId().toString();
                    collection.insertMany([{'url' : url, '_id' : key}], function(err, result) {
                        if (err) errorMess("Unable to connect", res);
                        var event = {original_url: url, short_url: "https://url-shortener-upanan82.herokuapp.com/" + key};
                        res.send(JSON.stringify(event));
                    });
                }
                else {
                    var event = {original_url: url, short_url: "https://url-shortener-upanan82.herokuapp.com/" + docs[0]._id};
                    res.send(JSON.stringify(event));
                }
                callback(docs);
            });
        };
        MongoClient.connect(urli, function(err, db) {
            if (err) errorMess("Unable to connect", res);
            console.log("Connected!");
            findDocuments(url, db, function() {
                db.close();
            });
        });
    }
    else errorMess("Invalid URL", res);
});

// Error function
function errorMess(str, res) {
    var event = {error: str};
    res.send(JSON.stringify(event));
    return 0;
}
