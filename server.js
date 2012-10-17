(function() {
  var Chat, Client, chat, http, server, webSocketServer, webSocketsPort, wsServer;

  Chat = (function() {

    function Chat() {
      this.clients = [];
    }

    Chat.prototype.sendReceivers = function() {
      var c, _i, _len, _ref;
      _ref = this.clients;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        c.sendList(this.getReceivers(c));
      }
    };

    Chat.prototype.connect = function(name, connection) {
      var client, i, srcName;
      i = 1;
      srcName = name;
      while (this.getClient(name)) {
        name = srcName + i;
        i++;
      }
      client = new Client(name, connection);
      this.clients.push(client);
      this.sendReceivers();
      return client;
    };

    Chat.prototype.disconnect = function(client) {
      var c, _i, _len, _ref;
      _ref = this.clients;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (!(c === client)) continue;
        delete this.clients[_i];
        this.clients.splice(_i, 1);
        this.sendReceivers();
        return;
      }
    };

    Chat.prototype.getClient = function(name) {
      var c, _i, _len, _ref;
      _ref = this.clients;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (c.id === name) return c;
      }
      return null;
    };

    Chat.prototype.getReceivers = function(client) {
      var c, _i, _len, _ref, _results;
      _ref = this.clients;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (c !== client) _results.push(c.id);
      }
      return _results;
    };

    return Chat;

  })();

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

    Client.prototype.htmlEntities = function(str) {
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    Client.prototype.sendData = function(data) {
      var jsonStr;
      jsonStr = JSON.stringify(data);
      if (this.connection) return this.connection.sendUTF(jsonStr);
    };

    Client.prototype.sendMessage = function(value, from, to) {
      var jsonOut;
      jsonOut = this.dataOut("message", from, to);
      jsonOut.data.val = this.htmlEntities(value);
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

  chat = new Chat();

  webSocketsPort = 1337;

  server = http.createServer();

  wsServer = new webSocketServer({
    httpServer: server
  });

  wsServer.on("request", function(request) {
    var client, connection;
    connection = request.accept(null, request.origin);
    client = null;
    connection.on("close", function(connection) {
      return chat.disconnect(client);
    });
    return connection.on("message", function(message) {
      var jsonIn, name, receiver, sender;
      jsonIn = JSON.parse(message.utf8Data);
      sender = chat.getClient(jsonIn.data.from);
      receiver = chat.getClient(jsonIn.data.to);
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
          return client = chat.connect(name, connection);
      }
    });
  });

  server.listen(webSocketsPort);

}).call(this);
