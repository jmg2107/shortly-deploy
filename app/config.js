
// if(!process.env.PROD){

//   var Bookshelf = require('bookshelf');
//   var path = require('path');

//   var db = Bookshelf.initialize({
//     client: 'sqlite3',
//     connection: {
//       host: '127.0.0.1',
//       user: 'your_database_user',
//       password: 'password',
//       database: 'shortlydb',
//       charset: 'utf8',
//       filename: path.join(__dirname, '../db/shortly.sqlite')
//     }
//   });

//   db.knex.schema.hasTable('urls').then(function(exists) {
//     if (!exists) {
//       db.knex.schema.createTable('urls', function (link) {
//         link.increments('id').primary();
//         link.string('url', 255);
//         link.string('base_url', 255);
//         link.string('code', 100);
//         link.string('title', 255);
//         link.integer('visits');
//         link.timestamps();
//       }).then(function (table) {
//         console.log('Created Table', table);
//       });
//     }
//   });

//   db.knex.schema.hasTable('users').then(function(exists) {
//     if (!exists) {
//       db.knex.schema.createTable('users', function (user) {
//         user.increments('id').primary();
//         user.string('username', 100).unique();
//         user.string('password', 100);
//         user.timestamps();
//       }).then(function (table) {
//         console.log('Created Table', table);
//       });
//     }
//   });
// }
//Production MONGO version
//else {
var mongoose = require ('mongoose');

var uriString = process.env.MONGOLAB_URI || 'mongodb://localhost/shortlydb';

mongoose.connect(uriString);
var db =  mongoose.connection;

db.once('open', function(){
  console.log("we're connected!");
})
db.on('error', console.error.bind(console, "connection error:"));


var Link = mongoose.Schema({
 visits: Number,
 link: String,
 title: String,
 code: String,
 base_url: String,
 url: String
});

var User = mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});

module.exports = db;
module.exports.User = User;
module.exports.Link = Link;
//}




