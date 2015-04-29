var Adapter = require('./Adapter');
var ssh2 = require('ssh2');
var kefir = require('kefir');
var clc = require('cli-color');

var SSHAdapter = function SSHAdapter(options) {
    var self = this;
    self.options = options;
    self.connection = new ssh2.Client();
    self.connectionEsstabilished = false;
    self.queueNext = kefir.emitter();
    self.queueData = kefir.emitter();

    self.queueData.onValue(function(v) {
        console.log(clc.greenBright('output:'), clc.green(v));
    });

    self.commandError = kefir.emitter();

    self.commandError.onValue(function(v) {
        console.log(clc.redBright('Error: '), clc.red(v));
    });

    self.connection.on('ready', function readyWrapper() {
        console.log(clc.cyan('SSH connection estabillished'));
        self.connectionEsstabilished = true;
    });
}

SSHAdapter.prototype = new Adapter();
SSHAdapter.prototype.constructor = SSHAdapter;

SSHAdapter.prototype.options = {};
SSHAdapter.prototype.workdir = "";
SSHAdapter.prototype.reportCodes = false;

// SSHAdapter.prototype.end = function sshEnd() {
//     this.connectionEsstabilished = false;
//     this.proccessConnectionEnd();    
// }

SSHAdapter.prototype.proccessConnectionEnd = function() {
    this.connection.end();
}

SSHAdapter.prototype.prepareCommand = function sshPrepareCommand(command, args) {
    if (args !== undefined) {
        for (var i=0;i<args.length;i++) {
            if (command.indexOf('{}') >= 0) {
                command = command.replace('{}', args[i]);
            }
        }        
    }


    if (this.workdir !== '') {
        command = "cd " + this.workdir + ' && ' + command;
    }

    return command;
}


SSHAdapter.prototype.send = function sshSend(command, args, closeConnection) {
    var self = this;

    command = self.prepareCommand(command, args);

    var execute = function(self, command) {
        self.connection.exec(command, function(err, stream) {
            stream.on('close', function(code, signal) {
                console.log(code, signal);
                self.end();
            });
            stream.on('data', function(data) {
                console.log(data.toString('utf8'));
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

SSHAdapter.prototype.cd = function cd(dir) {
    this.workdir = dir;
}

SSHAdapter.prototype.commit = function sshCommit() {
    console.log(clc.green('ready to process queue'));
    var self = this;

    var execute = function(self, command) {
        self.connection.exec(command, function(err, stream) {
            stream.on('close', function(code, signal) {
                self.queue = self.queue.slice(1);    
                self.queueNext.emit({code: code, signal: signal});

            }).on('data', function (buffer) {
                self.queueData.emit(buffer.toString('utf8'));
            }).stderr.on('data', function(data) {
                self.commandError.emit(data);
                  // console.log('STDERR: ' + data);
            });
        });
    }

    self.queueNext.onValue(function(v) {
        if (self.reportCodes) {
            var msg = v;
            if (typeof v === 'object') {
                msg = JSON.stringify(v);
            }
            console.log(clc.cyan(msg));           
        }

        if (self.queue.length) {
            var command = self.queue[0];
            command = self.prepareCommand(command.command, command.args);
            console.log(clc.yellowBright('command: '), clc.yellow(command));

            execute(self, command);
        } else {
            self.end();
        }
    });

    if (self.queue.length) {
        if (self.connectionEsstabilished) {
            self.queueNext('start');
        } else {
            self.connection.on('ready', function() { self.queueNext.emit('start') });
            self.connection.connect(self.options);
        }
    }


}

module.exports = SSHAdapter;