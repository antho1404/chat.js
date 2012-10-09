window.Chat = class Chat

  constructor: (@ip, @port) ->
    @dom_elem = $("<div class='chat-frame active' id='contact_list'><div class='chat-head'>Contacts</div><div class='visibility'/><div class='chat-list'/></div>")
    @conversations = []
    window.WebSocket ||= window.MozWebSocket
    return if not window.WebSocket

    _this = @
    $(".chat-head").live 'click', -> $(this).parent(".chat-frame").toggleClass "active"
    $(".contact").live 'click',   -> _this.getOrCreateConversation($(this).html()).activate()

    @initializeSocket()
    setInterval (=> @checkConnexion()), 3000

  initializeSocket: ->
    @socket = new WebSocket "ws://#{@ip}:#{@port}"
    @socket.onopen    =  => @socketOpen()
    @socket.onmessage = (message) => @socketMessage message

  socketOpen: ->
    $("body").append @dom_elem if $("#contact_list").size() is 0
    @name = window.location.hash
    if @name is ""
      @name = prompt("What's your name ?")
      window.location.hash = @name
    @socket.send JSON.stringify( type: "connect", data: { from: @name } )
    @enable()

  socketMessage: (message) ->
    json = JSON.parse message.data

    if json.type is 'message'
      from = json.data.from
      if from is @name
        @getOrCreateConversation(json.data.to).writeMessage json.data
      else
        @getOrCreateConversation(json.data.from).writeMessage json.data

    else if json.type is 'event'
      conversation = @getConversation json.data.from
      conversation.addEvent json.data if conversation

    else if json.type is "list"
      $(".chat-list", $("#contact_list")).html ''
      for c in json.data.val
        $(".chat-list", $("#contact_list")).append "<div class='contact'>#{c}</div>"
      for conversation in @conversations
        if conversation.receiver in json.data.val
          conversation.enable()
        else
          conversation.disable()

  getOrCreateConversation: (sender) ->
    conversation = @getConversation sender
    return conversation if conversation
    conversation = new Conversation @, sender, @conversations.length
    @conversations.push conversation
    conversation

  getConversation: (sender) ->
    for conversation in @conversations
      if conversation.receiver is sender
        return conversation

  checkConnexion: ->
    if @socket and @socket.readyState isnt 1
      @disable()
      @socket = null
    else
      @initializeSocket() if not @socket
      @enable() if @connected()

  disable: -> @dom_elem.addClass "disable"
  enable: -> @dom_elem.removeClass "disable"

  connected: ->
    @socket and @socket.readyState is 1