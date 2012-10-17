(function() {
  var Client, clients, connect, disconnect, getClient, getReceivers, htmlEntities, http, sendReceivers, server, webSocketServer, webSocketsServerPort, wsServer;

  Client = (function() {

    function Client(id, connection) {
      this.id = id;
      this.connection = connection;
    }

    Client.prototype.dataOut = function(type, from, to) {
      var res;
      if (from == null) from = null;
      if (to == null) to = null;
      res = {
        type: type,
        data: {}
      };
      if (from) res.data.from = from.id;
      if (to) res.data.to = to.id;
      return res;
    };

    Client.prototype.sendData = function(data) {
      var jsonStr;
      jsonStr = JSON.stringify(data);
      if (this.connection) return this.connection.sendUTF(jsonStr);
    };

    Client.prototype.sendMessage = function(value, from, to) {
      var jsonOut;
      jsonOut = this.dataOut("message", from, to);
      jsonOut.data.val = htmlEntities(value);
      return this.sendData(jsonOut);
    };

    Client.prototype.sendList = function(clients) {
      var jsonOut;
      jsonOut = this.dataOut("list", this);
      jsonOut.data.val = clients;
      return this.sendData(jsonOut);
    };

    return Client;

  })();

  webSocketServer = require("websocket").server;

  http = require("http");

  webSocketsServerPort = 1337;

  clients = [];

  server = http.createServer();

  wsServer = new webSocketServer({
    httpServer: server
  });

  wsServer.on("request", function(request) {
    var client, connection;
    connection = request.accept(null, request.origin);
    client = null;
    connection.on("close", function(connection) {
      return disconnect(client);
    });
    return connection.on("message", function(message) {
      var jsonIn, name, receiver, sender;
      jsonIn = JSON.parse(message.utf8Data);
      sender = getClient(jsonIn.data.from);
      receiver = getClient(jsonIn.data.to);
      switch (jsonIn.type) {
        case "message":
          if (!sender || !receiver) return;
          sender.sendMessage(jsonIn.data.val, sender, receiver);
          return receiver.sendMessage(jsonIn.data.val, sender, receiver);
        case "event":
          if (!receiver) return;
          return receiver.sendData(jsonIn);
        case "connect":
          if (jsonIn.data && jsonIn.data.from) name = jsonIn.data.from;
          if (!name) return;
          return client = connect(name, connection);
      }
    });
  });

  htmlEntities = function(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  sendReceivers = function() {
    var c, _i, _len;
    for (_i = 0, _len = clients.length; _i < _len; _i++) {
      c = clients[_i];
      c.sendList(getReceivers(c));
    }
  };

  connect = function(name, connection) {
    var client, i, srcName;
    i = 1;
    srcName = name;
    while (getClient(name)) {
      name = srcName + i;
      i++;
    }
    client = new Client(name, connection);
    clients.push(client);
    sendReceivers();
    return client;
  };

  disconnect = function(client) {
    var c, _i, _len;
    for (_i = 0, _len = clients.length; _i < _len; _i++) {
      c = clients[_i];
      if (!(c === client)) continue;
      delete clients[_i];
      clients.splice(_i, 1);
      sendReceivers();
      return;
    }
  };

  getClient = function(name) {
    var c, _i, _len;
    for (_i = 0, _len = clients.length; _i < _len; _i++) {
      c = clients[_i];
      if (c.id === name) return c;
    }
    return null;
  };

  getReceivers = function(client) {
    var c, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = clients.length; _i < _len; _i++) {
      c = clients[_i];
      if (c !== client) _results.push(c.id);
    }
    return _results;
  };

  server.listen(webSocketsServerPort);

}).call(this);
