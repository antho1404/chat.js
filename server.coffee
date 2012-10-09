"use strict"
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

    if jsonIn.type is "message"
      return if not sender or not receiver
      sender.sendMessage    jsonIn.data.val, sender, receiver
      receiver.sendMessage  jsonIn.data.val, sender, receiver
    
    else if jsonIn.type is "event"
      return if not receiver
      receiver.sendData jsonIn

    else if jsonIn.type is "connect"
      name = jsonIn.data.from if jsonIn.data and jsonIn.data.from
      return if not name
      client = connect name, connection
      

htmlEntities = (str) ->
  String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace /"/g, "&quot;"
  
sendReceivers = -> 
  c.sendList getReceivers(c) for c in clients
  return

connect = (name, connection) ->
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
  result = []
  for c in clients when c isnt client
    result.push c.id
  result

server.listen webSocketsServerPort

class Client
  constructor: (@id, @connection) ->

  dataOut: (type, from=null, to=null) ->
      type: type
      data: 
        from: from.id if from
        to: to.id if to

  sendData: (data) ->
    jsonStr = JSON.stringify data
    @connection.sendUTF jsonStr if @connection

  sendMessage: (value, from, to) ->
    jsonOut = @dataOut "message", from, to
    jsonOut.data.val = htmlEntities value
    @sendData jsonOut

  sendList: (clients) ->
    jsonOut = @dataOut "list"
    jsonOut.data.val = clients
    @sendData jsonOut
