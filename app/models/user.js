// var db = require('../config');
// var bcrypt = require('bcrypt-nodejs');
// var Promise = require('bluebird');

// var User = db.Model.extend({
//   tableName: 'users',
//   hasTimestamps: true,
//   initialize: function(){
//     this.on('creating', this.hashPassword);
//   },
//   comparePassword: function(attemptedPassword, callback) {
//     bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
//       callback(isMatch);
//     });
//   },
//   hashPassword: function(){
//     var cipher = Promise.promisify(bcrypt.hash);
//     return cipher(this.get('password'), null, null).bind(this)
//       .then(function(hash) {
//         this.set('password', hash);
//       });
//   }
// });

var mongoose = require('mongoose');
var User = require('../config').User;
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var db = require('../config');


// var user = new User();
// user.save(function (err, product, numAffected) {
//   if (err) return handleError(err);
//   // saved!
// })



// db.Users.methods.customSave = function(name, pwd){
//   this.find({username: name}, function(error, user){
//     if(error){
//       console.log("Error finding the name");
//     }
//     if(user){
//       console.log("user already exists");
//     } else {
//       var newPass = this.hashPassword(pwd);
//       this.save(function(err, ){
//         if(err){
//           console.log("error with saving new user");
//         } else {
//           {username: name, password: newPass}
//         }
//       });
//     }

//   });
// };

User.pre('save', function(next){
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});


var Users = mongoose.model('User', User);

Users.comparePassword = function(candidatePassword, attemptedPassword, callback) {
    bcrypt.compare(candidatePassword, attemptedPassword, function(err, isMatch) {
      callback(isMatch);
    });
  };

module.exports = Users;

