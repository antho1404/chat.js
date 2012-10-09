window.Conversation = class Conversation
  constructor: (@chat, @receiver, i) ->
    @typing_visible = false

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