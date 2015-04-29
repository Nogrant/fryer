var Adapter = function Adapter(options) {
    
}

Adapter.prototype.send = function sendExample(command, args, closeConnection) {};

Adapter.prototype.addToQueue = function addToQueueExample(command, args) {
    this.queue.push({'command' : command, 'args' : args});
};

Adapter.prototype.prepareCommand = function prepareCommandExample() {};

Adapter.prototype.commit = function commitExample() {};

Adapter.prototype.clearQueue = function clearQueue() {
    this.queue = queue;
};

Adapter.prototype.connect = function connectExample() {
    this.connectionEsstabilished = true;
};
Adapter.prototype.end = function end() {
    this.connectionEsstabilished = false;
    this.proccessConnectionEnd();
};

Adapter.prototype.proccessConnectionBegin = function proccessConnectionBegin() {};

Adapter.prototype.proccessConnectionEnd = function proccessConnectionEndExample() {};

Adapter.prototype.async = true;
Adapter.prototype.execImmidiatly = true;
Adapter.prototype.connectionEsstabilished = false;
Adapter.prototype.connection = null;
Adapter.prototype.queue = [];

module.exports = Adapter;