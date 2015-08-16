var hyperquest = require('hyperquest');
var through = require('through');
var concat = require('concat-stream');
var JSONStream = require('JSONStream');

module.exports = function (user, opts) {
    if (!opts) opts = {};
    var size = opts.size || 128;
    var maxAge = opts.maxAge !== undefined
        ? opts.maxAge : 3 * 24 * 60 * 60 * 1000
    ;
    var db = opts.db;

    var output = through();
    if (db) {
        db.get(user, function (err, u) {
            if (typeof u === 'string') {
                try { u = JSON.parse(u) }
                catch (err) { return output.emit('error', err) }
            }
            if (u && u.id && u.size === size && Date.now() - u.last < maxAge) {
                output.queue(Buffer(u.data, 'base64'));
                output.queue(null);
            }
            else if (u && u.id) {
                getImage(u.id);
            }
            else getUrl(getImage);
        });
    }
    else getUrl(getImage);

    return output;

    function getUrl (cb) {
        var hq = hyperquest('https://api.github.com/users/' + user, {
            headers: {
                'User-Agent': 'github-avatar'
            }
        });
        hq.on('error', output.emit.bind(output, 'error'));

        var parser = JSONStream.parse([ 'avatar_url' ]);
        parser.on('error', output.emit.bind(output, 'error'));

        var got = false;
        hq.pipe(parser).pipe(through(function (url) {
            if (got) return;
            got = true;
            cb(url);
        }));
    }

    function getImage (url) {
        var hq = hyperquest(url + '?s=' + size);
        var ok = false;
        hq.on('response', function (res) {
            ok = /^2/.test(res.statusCode);
        });
        hq.on('error', output.emit.bind(output, 'error'));
        hq.pipe(output);
        hq.pipe(concat(function (body) {
            var row = {
                url: url,
                last: Date.now(),
                data: body.toString('base64'),
                size: size
            };
            if (db && db.options && db.options.valueEncoding !== 'json') {
                row = JSON.stringify(row);
            }
            if (ok && db) db.put(user, row);
        }));
        return hq;
    }
};
