webSocketServer = require("websocket").server
http            = require("http")

webSocketsServerPort = 1337
clients              = []

server   = http.createServer()
wsServer = new webSocketServer(httpServer: server)

wsServer.on "request", (request) ->
  connection = request.accept null, request.origin
  client     = null

  connection.on "close", (connection) -> disconnect client
  
  connection.on "message", (message) ->
    jsonIn   = JSON.parse(message.utf8Data)
    sender   = getClient jsonIn.data.from
    receiver = getClient jsonIn.data.to

    switch jsonIn.type
      when "message"
        return if not sender or not receiver
        sender.sendMessage    jsonIn.data.val, sender, receiver
        receiver.sendMessage  jsonIn.data.val, sender, receiver
      
      when "event"
        return if not receiver
        receiver.sendData jsonIn

      when "connect"
        name = jsonIn.data.from if jsonIn.data and jsonIn.data.from
        return if not name
        client = connect name, connection
      
htmlEntities = (str) ->
  String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace /"/g, "&quot;"
  
sendReceivers = -> 
  c.sendList getReceivers(c) for c in clients
  return

connect = (name, connection) ->
  i = 1
  srcName = name
  while getClient name
    name = srcName + i
    i++
  client = new Client(name, connection)
  clients.push client
  sendReceivers()
  client

disconnect = (client) ->
  for c in clients when c is client
    delete clients[_i]
    clients.splice _i, 1
    sendReceivers()
    return

getClient = (name) ->
  for c in clients when c.id is name
    return c
  null

getReceivers = (client) ->
  c.id for c in clients when c isnt client

server.listen webSocketsServerPort