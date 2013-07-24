# github-avatar

fetch the github avatar for a user

# example

## simple

``` js
var avatar = require('github-avatar');
var fs =  require('fs');

avatar('substack').pipe(fs.createWriteStream('substack.jpg'));
```

## using leveldb for caching

``` js
var avatar = require('github-avatar');
var fs =  require('fs');
var level = require('level');

var img = avatar('substack', { db: level(__dirname + '/cache') });
img.pipe(fs.createWriteStream('substack.jpg'));
```

# methods

``` js
var avatar = require('github-avatar')
```

## var img = avatar(username, opts)

Return a readable stream `img` of jpeg image data for the github user
`username`.

Optionally:

* `opts.db` - a [leveldb](https://npmjs.org/package/level)
handle to use for caching
* `opts.size` - size in pixels of the image to generate
* `opts.maxAge` - how long in milliseconds to keep an image in the cache

# install

With [npm](https://npmjs.org) do:

```
npm install github-avatar
```

# license

MIT
