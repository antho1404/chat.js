class Client
  constructor: (@id, @connection) ->

  dataOut: (type, from=null, to=null) ->
    res = 
      type: type
      data: {}
    res.data.from = from.id if from
    res.data.to   = to.id   if to
    res

  sendData: (data) ->
    jsonStr = JSON.stringify data
    @connection.sendUTF jsonStr if @connection

  sendMessage: (value, from, to) ->
    jsonOut = @dataOut "message", from, to
    jsonOut.data.val = htmlEntities value
    @sendData jsonOut

  sendList: (clients) ->
    jsonOut = @dataOut "list", @
    jsonOut.data.val = clients
    @sendData jsonOut
