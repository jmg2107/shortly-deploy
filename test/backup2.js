var expect = require('chai').expect;
var request = require('request');

var db = require('../app/config');
var Users = require('../app/collections/users');
var User = require('../app/models/user');
var Links = require('../app/collections/links');
var Link = require('../app/models/link');

/************************************************************/
// Mocha doesn't have a way to designate pending before blocks.
// Mimic the behavior of xit and xdescribe with xbeforeEach.
// Remove the 'x' from beforeEach block when working on
// authentication tests.
/************************************************************/

/************************************************************/


describe('', function() {

  beforeEach(function() {
    // log out currently signed in user
    request('http://127.0.0.1:4568/logout', function(error, res, body) {});

    // delete link for roflzoo from db so it can be created later for the test
    db.knex('urls')
      .where('url', '=', 'http://roflzoo.com/')
      .del()
      .catch(function(error) {
        throw {
          type: 'DatabaseError',
          message: 'Failed to create test setup data'
        };
      });

    // delete user Svnh from db so it can be created later for the test
    db.knex('users')
      .where('username', '=', 'Svnh')
      .del()
      .catch(function(error) {
        // uncomment when writing authentication tests
        // throw {
        //   type: 'DatabaseError',
        //   message: 'Failed to create test setup data'
        // };
      });

    // delete user Phillip from db so it can be created later for the test
    db.knex('users')
      .where('username', '=', 'Phillip')
      .del()
      .catch(function(error) {
        // uncomment when writing authentication tests
        // throw {
        //   type: 'DatabaseError',
        //   message: 'Failed to create test setup data'
        // };
      });
  });

  describe('Link creation:', function(){

    var requestWithSession = request.defaults({jar: true});


    beforeEach(function(done){       // create a user that we can then log-in with
      new User({
          'username': 'Phillip',
          'password': 'Phillip'
      }).save().then(function(){
        var options = {
          'method': 'POST',
          'followAllRedirects': true,
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Phillip',
            'password': 'Phillip'
          }
        };
        // login via form and save session info
        requestWithSession(options, function(error, res, body) {
          done();
        });
      });
    });

    it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/links',
        'json': {
          'url': 'definitely not a valid url'
        }
      };

      requestWithSession(options, function(error, res, body) {
        // res comes from the request module, and may not follow express conventions
        expect(res.statusCode).to.equal(404);
        done();
      });
    });

    describe('Shortening links:', function(){

      var options = {
        'method': 'POST',
        'followAllRedirects': true,
        'uri': 'http://127.0.0.1:4568/links',
        'json': {
          'url': 'http://roflzoo.com/'
        }
      };

      it('Responds with the short code', function(done) {
        requestWithSession(options, function(error, res, body) {
          expect(res.body.url).to.equal('http://roflzoo.com/');
          expect(res.body.code).to.not.be.null;
          done();
        });
      });

      it('New links create a database entry', function(done) {
        requestWithSession(options, function(error, res, body) {
          db.knex('urls')
            .where('url', '=', 'http://roflzoo.com/')
            .then(function(urls) {
              if (urls['0'] && urls['0']['url']) {
                var foundUrl = urls['0']['url'];
              }
              expect(foundUrl).to.equal('http://roflzoo.com/');
              done();
            });
        });
      });

      it('Fetches the link url title', function (done) {
        requestWithSession(options, function(error, res, body) {
          db.knex('urls')
            .where('title', '=', 'Funny pictures of animals, funny dog pictures')
            .then(function(urls) {
              if (urls['0'] && urls['0']['title']) {
                var foundTitle = urls['0']['title'];
              }
              expect(foundTitle).to.equal('Funny pictures of animals, funny dog pictures');
              done();
            });
        });
      });

    }); // 'Shortening links'

    describe('With previously saved urls:', function(){

      var link;

      beforeEach(function(done){
        // save a link to the database
        link = new Link({
          url: 'http://roflzoo.com/',
          title: 'Funny pictures of animals, funny dog pictures',
          base_url: 'http://127.0.0.1:4568'
        });
        link.save().then(function(){
          done();
        });
      });

      it('Returns the same shortened code', function(done) {
        var options = {
          'method': 'POST',
          'followAllRedirects': true,
          'uri': 'http://127.0.0.1:4568/links',
          'json': {
            'url': 'http://roflzoo.com/'
          }
        };

        requestWithSession(options, function(error, res, body) {
          var code = res.body.code;
          expect(code).to.equal(link.get('code'));
          done();
        });
      });

      it('Shortcode redirects to correct url', function(done) {
        var options = {
          'method': 'GET',
          'uri': 'http://127.0.0.1:4568/' + link.get('code')
        };

        requestWithSession(options, function(error, res, body) {
          var currentLocation = res.request.href;
          expect(currentLocation).to.equal('http://roflzoo.com/');
          done();
        });
      });

      it('Returns all of the links to display on the links page', function(done) {
        var options = {
          'method': 'GET',
          'uri': 'http://127.0.0.1:4568/links'
        };

        requestWithSession(options, function(error, res, body) {
          expect(body).to.include('"title": "Funny pictures of animals, funny dog pictures"');
          expect(body).to.include('"code": "' + link.get('code') + '"');
          done();
        });
      });

    }); // 'With previously saved urls'

  }); // 'Link creation'


  describe ('Privileged Access:', function(){

    it('Redirects to login page if a user tries to access the main page and is not signed in', function(done) {
      request('http://127.0.0.1:4568/', function(error, res, body) {
        expect(res.req.path).to.equal('/login');
        done();
      });
    });

    it('Redirects to login page if a user tries to create a link and is not signed in', function(done) {
      request('http://127.0.0.1:4568/create', function(error, res, body) {
        expect(res.req.path).to.equal('/login');
        done();
      });
    });

    it('Redirects to login page if a user tries to see all of the links and is not signed in', function(done) {
      request('http://127.0.0.1:4568/links', function(error, res, body) {
        expect(res.req.path).to.equal('/login');
        done();
      });
    });

  }); // 'Priviledged Access'


  describe ('Account Creation:', function(){

    it('Signup creates a user record', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Svnh',
          'password': 'Svnh'
        }
      };

      request(options, function(error, res, body) {
        db.knex('users')
          .where('username', '=', 'Svnh')
          .then(function(res) {
            if (res[0] && res[0]['username']) {
              var user = res[0]['username'];
            }
            expect(user).to.equal('Svnh');
            done();
          }).catch(function(err) {
            throw {
              type: 'DatabaseError',
              message: 'Failed to create test setup data'
            };
          });
      });
    });

    it('Signup logs in a new user', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/signup',
        'json': {
          'username': 'Phillip',
          'password': 'Phillip'
        }
      };

      request(options, function(error, res, body) {
        expect(res.headers.location).to.equal('/');
        done();
      });
    });

  }); // 'Account Creation'


  describe ('Account Login:', function(){

    var requestWithSession = request.defaults({jar: true});

    beforeEach(function(done){
      new User({
          'username': 'Phillip',
          'password': 'Phillip'
      }).save().then(function(){
        done()
      });
    })

    it('Logs in existing users', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/login',
        'json': {
          'username': 'Phillip',
          'password': 'Phillip'
        }
      };

      requestWithSession(options, function(error, res, body) {
        expect(res.headers.location).to.equal('/');
        done();
      });
    });

    it('Users that do not exist are kept on login page', function(done) {
      var options = {
        'method': 'POST',
        'uri': 'http://127.0.0.1:4568/login',
        'json': {
          'username': 'Fred',
          'password': 'Fred'
        }
      };

      requestWithSession(options, function(error, res, body) {
        expect(res.headers.location).to.equal('/login');
        done();
      });
    });

  }); // 'Account Login'

});




// var request = require('supertest');
// var express = require('express');
// var expect = require('chai').expect;
// var app = require('../server.js');

// var db = require('../app/config');
// var User = require('../app/models/user');
// var Link = require('../app/models/link');

// /////////////////////////////////////////////////////
// // NOTE: these tests are designed for mongo!
// /////////////////////////////////////////////////////

// describe('', function() {

//   beforeEach(function(done) {
//     // Log out currently signed in user
//     request(app)
//       .get('/logout')
//       .end(function(err, res) {

//         // Delete objects from db so they can be created later for the test
//         Link.remove({url : 'http://www.roflzoo.com/'}).exec();
//         User.remove({username : 'Savannah'}).exec();
//         User.remove({username : 'Phillip'}).exec();

//         done();
//       });
//   });

//   describe('Link creation: ', function() {

//     it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function(done) {
//       request(app)
//         .post('/links')
//         .send({
//           'url': 'definitely not a valid url'})
//         .expect(404)
//         .end(done);
//     });

//     describe('Shortening links:', function() {

//       it('Responds with the short code', function(done) {
//         request(app)
//           .post('/links')
//           .send({
//             'url': 'http://www.roflzoo.com/'})
//           .expect(200)
//           .expect(function(res) {
//             expect(res.body.url).to.equal('http://www.roflzoo.com/');
//             expect(res.body.code).to.be.ok;
//           })
//           .end(done);
//       });

//       it('New links create a database entry', function(done) {
//         request(app)
//           .post('/links')
//           .send({
//             'url': 'http://www.roflzoo.com/'})
//           .expect(200)
//           .expect(function(res) {
//             Link.findOne({'url' : 'http://www.roflzoo.com/'})
//               .exec(function(err,link){
//                 if(err) console.log(err);
//                 expect(link.url).to.equal('http://www.roflzoo.com/');
//               });
//           })
//           .end(done);
//       });

//       it('Fetches the link url title', function(done) {
//         request(app)
//           .post('/links')
//           .send({
//             'url': 'http://www.roflzoo.com/'})
//           .expect(200)
//           .expect(function(res) {
//             Link.findOne({'url' : 'http://www.roflzoo.com/'})
//               .exec(function(err,link){
//                 if(err) console.log(err);
//                 expect(link.title).to.equal('Funny pictures of animals, funny dog pictures');
//               });
//           })
//           .end(done);
//       });

//     }); // 'Shortening Links'

//     describe('With previously saved urls: ', function() {

//       beforeEach(function(done) {
//         link = new Link({
//           url: 'http://www.roflzoo.com/',
//           title: 'Rofl Zoo - Daily funny animal pictures',
//           base_url: 'http://127.0.0.1:4568',
//           visits: 0
//         })

//         link.save(function() {
//           done();
//         });
//       });

//       it('Returns the same shortened code if attempted to add the same URL twice', function(done) {
//         var firstCode = link.code
//         request(app)
//           .post('/links')
//           .send({
//             'url': 'http://www.roflzoo.com/'})
//           .expect(200)
//           .expect(function(res) {
//             var secondCode = res.body.code;
//             expect(secondCode).to.equal(firstCode);
//           })
//           .end(done);
//       });

//       it('Shortcode redirects to correct url', function(done) {
//         var sha = link.code;
//         request(app)
//           .get('/' + sha)
//           .expect(302)
//           .expect(function(res) {
//             var redirect = res.headers.location;
//             expect(redirect).to.equal('http://www.roflzoo.com/');
//           })
//           .end(done);
//       });

//     }); // 'With previously saved urls'

//   }); // 'Link creation'

//   describe('Priviledged Access:', function(){

//     // /*  Authentication  */
//     // // TODO: xit out authentication
//     it('Redirects to login page if a user tries to access the main page and is not signed in', function(done) {
//       request(app)
//         .get('/')
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/login');
//         })
//         .end(done);
//     });

//     it('Redirects to login page if a user tries to create a link and is not signed in', function(done) {
//       request(app)
//         .get('/create')
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/login');
//         })
//         .end(done);
//     });

//     it('Redirects to login page if a user tries to see all of the links and is not signed in', function(done) {
//       request(app)
//         .get('/links')
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/login');
//         })
//         .end(done);
//     });

//   }); // 'Privileged Access'

//   describe('Account Creation:', function(){

//     it('Signup creates a new user', function(done) {
//       request(app)
//         .post('/signup')
//         .send({
//           'username': 'Svnh',
//           'password': 'Svnh' })
//         .expect(302)
//         .expect(function() {
//           User.findOne({'username': 'Svnh'})
//             .exec(function(err,user) {
//               expect(user.username).to.equal('Svnh');
//             });
//         })
//         .end(done);
//     });

//     it('Successful signup logs in a new user', function(done) {
//       request(app)
//         .post('/signup')
//         .send({
//           'username': 'Phillip',
//           'password': 'Phillip' })
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/');
//           request(app)
//             .get('/logout')
//             .expect(200)
//         })
//         .end(done);
//     });

//   }); // 'Account Creation'

//   describe('Account Login:', function(){

//     beforeEach(function(done) {
//       new User({
//           'username': 'Phillip',
//           'password': 'Phillip'
//       }).save(function(){
//         done();
//       });
//     });

//     it('Logs in existing users', function(done) {
//       request(app)
//         .post('/login')
//         .send({
//           'username': 'Phillip',
//           'password': 'Phillip' })
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/');
//         })
//         .end(done);
//     });

//     it('Users that do not exist are kept on login page', function(done) {
//       request(app)
//         .post('/login')
//         .send({
//           'username': 'Fred',
//           'password': 'Fred' })
//         .expect(302)
//         .expect(function(res) {
//           expect(res.headers.location).to.equal('/login');
//         })
//         .end(done)
//       });

//   }); // Account Login

// });
