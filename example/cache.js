var avatar = require('../');
var fs =  require('fs');
var level = require('level');

var img = avatar('substack', { db: level(__dirname + '/cache') });
img.pipe(fs.createWriteStream('substack.jpg'));
