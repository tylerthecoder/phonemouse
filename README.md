# Phone Mouse

Quick and easy way to control your mouse and keyboard with your phone.

All written in go.

cli app you download that displays a QR code. Go to website and scan the QR code and then you can control the mouse and keyboard.

Display qr code with qrencode package
example:
```
https://superuser.com/questions/1492624/how-do-you-output-a-qr-code-to-the-linux-cli-terminal-for-scanning
```

The qr code points you to a url with an id as a parameter. And connects to the websocket server.

The ui has a canvas with a red ball in the center. When you touch that ball and move it, it sends the diff to the server.

The cli connects to the websocket server as well and listens for commands from clients with the same id. When it gets a command, it moves the mouse.


Websocket server written in go.
Two types of clients:
1. cli app
2. web app