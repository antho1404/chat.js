class Chat
  constructor: ->
    @clients = []

  sendReceivers: -> 
    c.sendList @getReceivers(c) for c in @clients
    return

  connect: (name, connection) ->
    i = 1
    srcName = name
    while @getClient name
      name = srcName + i
      i++
    client = new Client(name, connection)
    @clients.push client
    @sendReceivers()
    client

  disconnect: (client) ->
    for c in @clients when c is client
      delete @clients[_i]
      @clients.splice _i, 1
      @sendReceivers()
      return

  getClient: (name) ->
    return c for c in @clients when c.id is name
    null

  getReceivers: (client) ->
    c.id for c in @clients when c isnt client
