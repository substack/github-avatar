var avatar = require('../');
var fs =  require('fs');

avatar('substack').pipe(fs.createWriteStream('substack.jpg'));
