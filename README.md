# chat.js


A node.js chat using websocket

## How to run it
First you need to install dependencies using 
> npm install

This will fetch and install all dependencies for a node project (in this case only the websocket dependency)

After that you will be able to run the server with
> node server.js

If you want to use the coffee file don't forget to recompile it before running the server with the command
> coffee -c server.coffee

## How to use it
You need to include the **chat.css** and **chat.js** (located in **compiled** folder) in your web page and add the following javascript
> new Chat(address)

With address: the address of your server without protocol.

If you have change the port in **server.js** you can specify the used port like that
> new Chat(address, port)

The chat will be automatically activated/desactivated if your server is up/down.

### Compiling
If you need to recompile the assets you can use the following commands
> For coffee files
> > coffee -cj compiled/chat.js assets/*.coffee 

> For SCSS file
> > sass assets/chat.css.scss compiled/chat.css