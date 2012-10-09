window.Chat = class Chat

  constructor: (@ip, @port) ->
    @dom_elem = $("<div class='chat-frame active' id='contact_list'><div class='chat-head'>Contacts</div><div class='visibility'/><div class='chat-list'/></div>")
    @conversations = []
    _this = @
    window.WebSocket ||= window.MozWebSocket
    return if not window.WebSocket

    $(".chat-head").live 'click', -> $(this).parent(".chat-frame").toggleClass "active"
    $(".contact").live 'click', -> _this.getOrCreateConversation($(this).html()).activate()

    @initializeSocket()
    setInterval (-> _this.checkConnexion()), 3000

  initializeSocket: ->
    _this = @
    @socket = new WebSocket "ws://#{@ip}:#{@port}"
    @socket.onopen    =  -> _this.socketOpen()
    @socket.onmessage = (message) -> _this.socketMessage message

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


window.Conversation = class Conversation
  constructor: (@chat, @receiver, i) ->
    @typing_visible = false

    _this = @
    @dom_elem = $("<div class='chat-frame active' style='right:#{260 * (i + 1) + 10}px'><div class='chat-head'>#{@receiver}</div><div class='visibility'/><div class='chat-content'/><div class='chat-status'/><div class='chat-message'><input></div></div>")
    @input = $("input", @dom_elem)
    $("body").append @dom_elem
    @linkDomEvents()

  linkDomEvents: ->
    _this = @
    $(".chat-content", @dom_elem).on
      click  : (e) -> _this.input.focus()
    $(".chat-message input").on
      keydown: (e) -> _this.keydown e
      keyup  : (e) -> _this.keyup e

  writeMessage: (data) ->
    name = if data.from is @chat.name then "me" else data.from
    content = $(".chat-content", @dom_elem)[0]
    $(content).append "<span class='client'>#{name}</span> - <span>#{data.val}</span><br/>"
    content.scrollTop = content.scrollHeight

  addEvent: (data) ->
    if @typing_visible
      data.val ||= ""
      $(".chat-status", @dom_elem).html data.val
    else
      $(".chat-status", @dom_elem).removeClass().addClass("chat-status").addClass data.val

  connected: ->
    @chat.connected()

  enable: -> @dom_elem.removeClass "disable"
  disable: -> @dom_elem.addClass "disable"

  activate: ->
    @dom_elem.addClass "active"

  keydown: (e) ->
    return if not @connected()
    if e.keyCode is 13
      msg = @input.val()
      return if !msg
      data = 
        type: "message"
        data:
          from: @chat.name
          to: @receiver
          val: msg
      @chat.socket.send JSON.stringify(data)
      @input.val ''

  keyup: (e) ->
    return if not @connected()
    msg = @input.val()
    data = 
      from: @chat.name
      to: @receiver
      val: if @typing_visible then msg else (if msg then "typing" else "none")
    @chat.socket.send JSON.stringify(type: "event", data: data)