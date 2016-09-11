var rest   = require('../')
  , _      = require('lodash')
  , axios  = require('axios')
  , assert = require('assert');

describe('integrate', function() {

  describe('#un-init', function() {

    it('check type', function(done) {
      assert.ok(rest instanceof Function);

      done();
    });

    it('uncaughtException', function(done) {
      var errorLog = rest.utils.logger.error;
      rest.utils.logger.error = function(error) {
        assert.ok(error instanceof Error);
        assert.equal('Hello this is a uncaught expection.', error.message);
        rest.utils.logger.error = errorLog;

        done();
      };

      setTimeout(function() {
        throw Error('Hello this is a uncaught expection.');
      }, 10);

    });

    it('rejectionHandled', function(done) {
      var errorLog = rest.utils.logger.error
        , promise;
      rest.utils.logger.error = function(error, p) {
        assert.ok(error instanceof Error);
        assert.equal('Hello this is a unregist rejection', error.message);
        rest.utils.logger.error = errorLog;

        done();
      };

      promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(Error('Hello this is a unregist rejection'));
        }, 10);
      });
      setTimeout(function() {
        promise.then(function() {
          console.log('Dont run here!')
        });
      }, 10);
    });

    it('unhandleRejection', function(done) {
      var errorLog = rest.utils.logger.error
        , promise;
      rest.utils.logger.error = function(error, p) {
        assert.ok(error instanceof Error);
        assert.equal('Hello this is a unregist rejection', error.message);
        rest.utils.logger.error = errorLog;

        done();
      };

      promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(Error('Hello this is a unregist rejection'));
        }, 10);
      });
      promise.then(function() {
        console.log('Dont run here!')
      })

    });

    it('attach object check', function(done) {
      var attachs = [
        'Router', 'helper', 'model', 'utils',
        'errors', 'restify', 'Sequelize', 'mysql'
      ];
      _.each(attachs, function(x) {
        assert.ok(rest[x]);
      });

      done();
    });

  });

  describe('#inited', function() {

    var restify       = require('restify')
      , pkg           = require('../package')
      , U             = require('../lib/utils')
      , model         = require('../lib/model')
      , config        = require('./app/configs')
      , log           = U.logger.info
      , errorLog      = U.logger.error
      , createServer  = restify.createServer
      , modelInit     = model.init;

    restify.createServer = function(option) {
      assert.equal('open-rest', option.name);
      assert.equal('1.0.0', option.version);

      return createServer.call(restify, option);
    };

    model.init = function(db, modelPath) {
      assert.deepEqual(config.db, db);
      assert.equal(__dirname + '/app/models', modelPath);
      return modelInit.call(model, db, modelPath, true);
    };

    it('only difined root path', function(done) {
      U.logger.info = function() {};
      U.logger.error = function() {};

      var listen = rest(__dirname + '/app');

      setTimeout(function() {
        restify.createServer = createServer;
        U.logger.info = log;
        U.logger.error = errorLog;
        model.init = modelInit;
        if (listen.listening) listen.close();

        done();
      }, 100);
    });

    it('define app path', function(done) {
      var _root = __dirname + '/app';
      U.logger.info = function() {};
      U.logger.error = function() {};

      var listen = rest({
        appPath: _root
      });

      setTimeout(function() {
        restify.createServer = createServer;
        U.logger.info = log;
        U.logger.error = errorLog;
        model.init = modelInit;
        if (listen.listening) listen.close();

        done();
      }, 100);
    });

    it('appPath non-exists', function(done) {
      assert.throws(function() {
        rest({configPath: __dirname + '/app/configs'});
      }, function(error) {
        return error instanceof Error && error.message === 'Lack appPath: absolute path of your app';
      });

      done();
    });

    it('route path type error or non-exists', function(done) {
      assert.throws(function() {
        rest({
          appPath: __dirname + '/app',
          configPath: __dirname + '/app/configs.js',
          routePath: [__dirname + '/app/route']
        });
      }, function(error) {
        return error instanceof Error && error.message === 'routePath must be a string and be a existed path';
      });

      assert.throws(function() {
        rest({
          appPath: __dirname + '/app',
          configPath: __dirname + '/app/configs.js',
          routePath: __dirname + '/app/route'
        });
      }, function(error) {
        return error instanceof Error && error.message === 'routePath must be a string and be a existed path';
      });

      done();
    });

    it('request home /', function(done) {
      var _root = __dirname + '/app';
      U.logger.info = function() {};
      U.logger.error = function() {};

      var listen = rest({
        appPath: _root,
        middleWarePath: __dirname + '/app/no-middle-wares'
      }, function(error, server) {
        assert.equal(null, error);
        assert.ok(listen.listening);

        restify.createServer = createServer;
        U.logger.info = log;
        U.logger.error = errorLog;
        model.init = modelInit;

        axios.get('http://127.0.0.1:8080/').then(function(response) {
          if (listen.listening) listen.close();
          try {
            assert.equal(200, response.status);
            assert.equal('OK', response.statusText);
            assert.equal('application/json; charset=utf-8', response.headers['content-type']);
            assert.equal('Hello world, I am open-rest.', response.data);
          } catch (e) {
            return done(e);
          }
          done();
        }).catch(function(error) {
          if (listen.listening) listen.close();
          assert.equal(null, error);
          done();
        });
      });

    });

    it('request /unexpetion ', function(done) {
      var _root = __dirname + '/app';
      U.logger.info = function() {};
      U.logger.error = function() {};

      var listen = rest({
        appPath: _root,
        middleWarePath: __dirname + '/app/no-middle-wares'
      }, function(error, server) {
        assert.equal(null, error);
        assert.ok(listen.listening);

        restify.createServer = createServer;
        U.logger.info = log;
        U.logger.error = errorLog;
        model.init = modelInit;

        axios.get('http://127.0.0.1:8080/unexception').then(function(response) {
          if (listen.listening) listen.close();
          try {
            assert.equal(200, response.status);
            assert.equal('OK', response.statusText);
            assert.equal('application/json; charset=utf-8', response.headers['content-type']);
            assert.equal('Hello world, I am open-rest.', response.data);
          } catch (e) {
            return done(e);
          }
          done();
        }).catch(function(error) {
          if (listen.listening) listen.close();
          assert.equal(500, error.response.status);
          assert.equal('Internal Server Error', error.response.statusText);
          assert.deepEqual({
            message: 'Ooh, there are some errors.'
          }, error.response.data);
          done();
        });
      });

    });

  });

});