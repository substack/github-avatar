var hyperquest = require('hyperquest');
var through = require('through');
var concat = require('concat-stream');
var JSONStream = require('JSONStream');

var MAX_AGE = 3 * 24 * 60 * 60 * 1000;
var SIZE = 64;

module.exports = function (db, user) {
    var output = through();
    
    db.get(user, function (err, u) {
        if (u && u.id && u.size === SIZE
        && Date.now() - u.last < MAX_AGE) {
            output.queue(Buffer(u.data, 'base64'));
            output.queue(null);
        }
        else if (u && u.id) {
            getImage(u.id);
        }
        else {
            var hq = hyperquest('https://api.github.com/users/' + user);
            hq.on('error', output.emit.bind(output, 'error'));
            
            var got = false;
            hq.pipe(JSONStream.parse([ 'gravatar_id' ]))
                .pipe(through(function (id) {
                    if (got) return;
                    got = true;
                    getImage(id);
                }))
            ;
        }
    });
    
    return output;
    
    function getImage (id) {
        var hq = hyperquest('http://gravatar.com/avatar/' + id + '?s=' + SIZE);
        var ok = false;
        hq.on('response', function (res) {
            ok = /^2/.test(res.statusCode);
        });
        hq.on('error', output.emit.bind(output, 'error'));
        hq.pipe(output);
        hq.pipe(concat(function (body) {
            if (ok) db.put(user, {
                id: id,
                last: Date.now(),
                data: body.toString('base64'),
                size: SIZE
            });
        }));
        return hq;
    }
};
