var Adapter = require('./Adapter');
var ssh2 = require('ssh2');
var kefir = require('kefir');

var SSHAdapter = function SSHAdapter(options) {
    var self = this;
    self.options = options;
    self.connection = new ssh2.Client();
    self.connectionEsstabilished = false;
    self.queueNext = kefir.emitter();

    self.connection.on('ready', function readyWrapper() {
        self.connectionEsstabilished = true;
    });
}

SSHAdapter.prototype.send = function sshSend(command, args, closeConnection) {
    var self = this;

    if (args !== undefined) {
        command = self.prepareCommand(command, args);
    }

    var execute = function(self, command) {
        self.connection.exec(command, function(err, stream) {
            stream.on('close', function(code, signal) {
                console.log(code, signal);
                self.end();
            });
            stream.on('data', function(data) {
                console.log(data);
            });
        });
    }

    if (self.connectionEsstabilished) {
        execute(self, command);
    } else {
        self.connection.on('ready', function() { execute(self, command); });
        self.connection.connect(self.options);
    }
}

SSHAdapter.prototype.commit = function sshCommit() {

}

SSHAdapter.prototype = Adapter;
SSHAdapter.prototype.constructor = SSHAdapter;

SSHAdapter.prototype.options = {};

module.exports = SSHAdapter;