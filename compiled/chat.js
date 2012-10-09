(function() {
  var Chat, Conversation;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  window.Chat = Chat = (function() {
    function Chat(ip, port) {
      var _this;
      this.ip = ip;
      this.port = port != null ? port : 1337;
      this.dom_elem = $("<div class='chat-frame active disable' id='contact_list'><div class='chat-head'>Contacts</div><div class='visibility'/><div class='chat-list'/></div>");
      this.conversations = [];
      window.WebSocket || (window.WebSocket = window.MozWebSocket);
      if (!window.WebSocket) {
        return;
      }
      _this = this;
      $(".chat-head").live('click', function() {
        return $(this).parent(".chat-frame").toggleClass("active");
      });
      $(".contact").live('click', function() {
        return _this.getOrCreateConversation($(this).html()).activate();
      });
      this.initializeSocket();
      setInterval((__bind(function() {
        return this.checkConnexion();
      }, this)), 3000);
    }
    Chat.prototype.initializeSocket = function() {
      this.socket = new WebSocket("ws://" + this.ip + ":" + this.port);
      this.socket.onopen = __bind(function() {
        return this.socketOpen();
      }, this);
      return this.socket.onmessage = __bind(function(message) {
        return this.socketMessage(message);
      }, this);
    };
    Chat.prototype.socketOpen = function() {
      var name;
      if ($("#contact_list").size() === 0) {
        $("body").append(this.dom_elem);
      }
      name = window.location.hash.substr(1);
      if (name !== "") {
        this.name = name;
      } else {
        this.name = prompt("What's your name ?");
        if (this.name) {
          window.location.hash = this.name;
        }
      }
      if (this.name) {
        this.socket.send(JSON.stringify({
          type: "connect",
          data: {
            from: this.name
          }
        }));
        return this.enable();
      }
    };
    Chat.prototype.socketMessage = function(message) {
      var c, conversation, from, json, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      json = JSON.parse(message.data);
      if (json.type === 'message') {
        from = json.data.from;
        if (from === this.name) {
          return this.getOrCreateConversation(json.data.to).writeMessage(json.data);
        } else {
          return this.getOrCreateConversation(json.data.from).writeMessage(json.data);
        }
      } else if (json.type === 'event') {
        conversation = this.getConversation(json.data.from);
        if (conversation) {
          return conversation.addEvent(json.data);
        }
      } else if (json.type === "list") {
        $(".chat-list", $("#contact_list")).html('');
        _ref = json.data.val;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          $(".chat-list", $("#contact_list")).append("<div class='contact'>" + c + "</div>");
        }
        _ref2 = this.conversations;
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          conversation = _ref2[_j];
          _results.push((_ref3 = conversation.receiver, __indexOf.call(json.data.val, _ref3) >= 0) ? conversation.enable() : conversation.disable());
        }
        return _results;
      }
    };
    Chat.prototype.getOrCreateConversation = function(sender) {
      var conversation;
      conversation = this.getConversation(sender);
      if (conversation) {
        return conversation;
      }
      conversation = new Conversation(this, sender, this.conversations.length);
      this.conversations.push(conversation);
      return conversation;
    };
    Chat.prototype.getConversation = function(sender) {
      var conversation, _i, _len, _ref;
      _ref = this.conversations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        conversation = _ref[_i];
        if (conversation.receiver === sender) {
          return conversation;
        }
      }
    };
    Chat.prototype.checkConnexion = function() {
      if (this.socket && this.socket.readyState !== 1) {
        this.disable();
        return this.socket = null;
      } else {
        if (!this.socket || !this.name) {
          this.initializeSocket();
        }
        if (this.connected()) {
          return this.enable();
        }
      }
    };
    Chat.prototype.disable = function() {
      return this.dom_elem.addClass("disable");
    };
    Chat.prototype.enable = function() {
      return this.dom_elem.removeClass("disable");
    };
    Chat.prototype.connected = function() {
      return this.socket && this.socket.readyState === 1;
    };
    return Chat;
  })();
  window.Conversation = Conversation = (function() {
    function Conversation(chat, receiver, i) {
      this.chat = chat;
      this.receiver = receiver;
      this.typing_visible = false;
      this.dom_elem = $("<div class='chat-frame active' style='right:" + (260 * (i + 1) + 10) + "px'><div class='chat-head'>" + this.receiver + "</div><div class='visibility'/><div class='chat-content'/><div class='chat-status'/><div class='chat-message'><input></div></div>");
      this.input = $("input", this.dom_elem);
      $("body").append(this.dom_elem);
      this.linkDomEvents();
    }
    Conversation.prototype.linkDomEvents = function() {
      $(".chat-content", this.dom_elem).on({
        click: __bind(function(e) {
          return this.input.focus();
        }, this)
      });
      return $(".chat-message input").on({
        keydown: __bind(function(e) {
          return this.keydown(e);
        }, this),
        keyup: __bind(function(e) {
          return this.keyup(e);
        }, this)
      });
    };
    Conversation.prototype.writeMessage = function(data) {
      var content, name;
      name = data.from === this.chat.name ? "me" : data.from;
      content = $(".chat-content", this.dom_elem)[0];
      $(content).append("<span class='client'>" + name + "</span> - <span>" + data.val + "</span><br/>");
      return content.scrollTop = content.scrollHeight;
    };
    Conversation.prototype.addEvent = function(data) {
      if (this.typing_visible) {
        data.val || (data.val = "");
        return $(".chat-status", this.dom_elem).html(data.val);
      } else {
        return $(".chat-status", this.dom_elem).removeClass().addClass("chat-status").addClass(data.val);
      }
    };
    Conversation.prototype.connected = function() {
      return this.chat.connected();
    };
    Conversation.prototype.enable = function() {
      return this.dom_elem.removeClass("disable");
    };
    Conversation.prototype.disable = function() {
      return this.dom_elem.addClass("disable");
    };
    Conversation.prototype.activate = function() {
      return this.dom_elem.addClass("active");
    };
    Conversation.prototype.keydown = function(e) {
      var data, msg;
      if (!this.connected()) {
        return;
      }
      if (e.keyCode === 13) {
        msg = this.input.val();
        if (!msg) {
          return;
        }
        data = {
          type: "message",
          data: {
            from: this.chat.name,
            to: this.receiver,
            val: msg
          }
        };
        this.chat.socket.send(JSON.stringify(data));
        return this.input.val('');
      }
    };
    Conversation.prototype.keyup = function(e) {
      var data, msg;
      if (!this.connected()) {
        return;
      }
      msg = this.input.val();
      data = {
        from: this.chat.name,
        to: this.receiver,
        val: this.typing_visible ? msg : (msg ? "typing" : "none")
      };
      return this.chat.socket.send(JSON.stringify({
        type: "event",
        data: data
      }));
    };
    return Conversation;
  })();
}).call(this);
