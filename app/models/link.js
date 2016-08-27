// var db = require('../config');
// var crypto = require('crypto');

// var Link = db.Model.extend({
//   tableName: 'urls',
//   hasTimestamps: true,
//   defaults: {
//     visits: 0
//   },
//   initialize: function(){
//     this.on('creating', function(model, attrs, options){
//       var shasum = crypto.createHash('sha1');
//       shasum.update(model.get('url'));
//       model.set('code', shasum.digest('hex').slice(0, 5));
//     });
//   }
// });

// module.exports = Link;
var mongoose = require('mongoose');
var Link = require('../config').Link;
var crypto = require('crypto');


var Sha = function(url){
  var shasum = crypto.createHash('sha1');
    shasum.update(url);
    return shasum.digest('hex').slice(0, 5);

};
Link.pre('save', function(next){
  var code = Sha(this.url);
  this.code = code;
  next();

})

var Links = mongoose.model('Link', Link);

module.exports = Links;