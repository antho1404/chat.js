webSocketServer = require("websocket").server
http            = require("http")

chat            = new Chat()  

webSocketsPort  = 1337
server          = http.createServer()
wsServer        = new webSocketServer(httpServer: server)

wsServer.on "request", (request) ->
  connection = request.accept null, request.origin
  client     = null

  connection.on "close", (connection) -> chat.disconnect client
  
  connection.on "message", (message) ->
    jsonIn   = JSON.parse(message.utf8Data)
    sender   = chat.getClient jsonIn.data.from
    receiver = chat.getClient jsonIn.data.to

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
        client = chat.connect name, connection
      
server.listen webSocketsPort