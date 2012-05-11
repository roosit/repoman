var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  repoman;

describe('repoman', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/repoman', {
      requires: {
        bagofholding: {
          cli: {
            exec: function fn(command, fallthrough, cb) {
              cb(null, fn['arguments']);
            }
          },
          text: bag.text
        }
      },
      globals: {
        console: bag.mock.console(checks),
        process: bag.mock.process(checks, mocks)
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('run', function () {

    it('should not log anything when repositories and scms do not exist', function (done) {
      mocks.process_cwd = '/somedir';
      repoman = new (create(checks, mocks))({}, {});
      repoman.run('init', function cb(err, results) {
        checks.repoman_run_cb_args = cb['arguments'];
        done();        
      });
      checks.console_log_messages.length.should.equal(0);

      should.not.exist(checks.repoman_run_cb_args[0]);
      Object.keys(checks.repoman_run_cb_args[1]).length.should.equal(0);
    });

    it('should log repositories name and execute commands with parameters applied when repositories exist', function (done) {
      mocks.process_cwd = '/somedir';
      var repos = {
          "couchdb": {
            "type": "git",
            "url": "http://git-wip-us.apache.org/repos/asf/couchdb.git"
          },
          "httpd": {
            "type": "svn",
            "url": "http://svn.apache.org/repos/asf/httpd/httpd/trunk/"
          }
        },
        scms = {
          "git": {
            "init": "git clone {url} {workspace}/{name}"
          },
          "svn": {
            "init": "svn checkout {url} {workspace}/{name}"
          }
        };
      repoman = new (create(checks, mocks))(repos, scms);
      repoman.run('init', function cb(err, results) {
        checks.repoman_run_cb_args = cb['arguments'];
        done();        
      });
      checks.console_log_messages.length.should.equal(2);
      checks.console_log_messages[0].should.equal('+ couchdb');
      checks.console_log_messages[1].should.equal('+ httpd');

      should.not.exist(checks.repoman_run_cb_args[0]);

      checks.repoman_run_cb_args[1][0][0].should.equal('git clone http://git-wip-us.apache.org/repos/asf/couchdb.git /somedir/couchdb')
      checks.repoman_run_cb_args[1][0][1].should.equal(true);
      checks.repoman_run_cb_args[1][0][2].should.be.a('function');
      checks.repoman_run_cb_args[1][1][0].should.equal('svn checkout http://svn.apache.org/repos/asf/httpd/httpd/trunk/ /somedir/httpd')
      checks.repoman_run_cb_args[1][1][1].should.equal(true);
      checks.repoman_run_cb_args[1][1][2].should.be.a('function');
    });
  });
});
 