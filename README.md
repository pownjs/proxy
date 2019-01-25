[![Follow on Twitter](https://img.shields.io/twitter/follow/pownjs.svg?logo=twitter)](https://twitter.com/pownjs)
![NPM](https://img.shields.io/npm/v/pown.svg)

# Pown Proxy

Pown Proxy is a versatile web debugging proxy. You can use the proxy to monitor, intercept and investigate web traffic in active or passive mode.

## Quickstart

If installed globally as part of [Pown.js](https://github.com/pownjs/pown) invoke like this:

```sh
$ pown proxy
```

Otherwise install this module from the root of your project:

```sh
$ npm install @pown/proxy --save
```

Once done, invoke pown proxy like this:

```sh
$ ./node_modules/.bin/pown-cli proxy
```

## Usage

> **WARNING**: This pown command is currently under development and as a result will be subject to breaking changes.

```
pown proxy [options]

HTTP proxy

Options:
  --version                 Show version number                        [boolean]
  --modules, -m             Load modules                                [string]
  --help                    Show help                                  [boolean]
  --log, -l                 Log requests and responses[boolean] [default: false]
  --host, -h                Host to listen to      [string] [default: "0.0.0.0"]
  --port, -p                Port to listen to           [number] [default: 8080]
  --text, -t                Start with text ui        [boolean] [default: false]
  --ws-client, -c           Connect to web socket         [string] [default: ""]
  --ws-server, -s           Forward on web socket     [boolean] [default: false]
  --ws-host                 Web socket server host [string] [default: "0.0.0.0"]
  --ws-port                 Web socket server port      [number] [default: 9090]
  --ws-app                  Open app
                                [string] [choices: "", "httpview"] [default: ""]
  --certs-dir               Directory for the certificates
                              [string] [default: "/Users/pdp/.pown/proxy/certs"]
  --server-key-length       Default key length for certificates
                                                        [number] [default: 1024]
  --default-ca-common-name  The CA common name
                                             [string] [default: "Pown.js Proxy"]
```

## Text Mode

Pown Proxy comes with intriguing text-based user interface available via the `-t` flag. The interface resembles popular security tools such as Burp, ZAP and SecApps' HTTPView, but only utilizing console capabilities such as ANSI escape sequences.

![](https://media.githubusercontent.com/media/pownjs/pown-proxy/master/screenshots/01.png)
![](https://media.githubusercontent.com/media/pownjs/pown-proxy/master/screenshots/02.png)
![](https://media.githubusercontent.com/media/pownjs/pown-proxy/master/screenshots/03.png)

## Web Sockets Mode

Pown Proxy provides a handy WebSocket-based API, backed by a simple binary protocol to interface with other tools, thus allowing it to be used as a backend proxy service. This technique is used to power tools such as SecApps' HTTPView.

The WebSocket server can be accessed via the `-s` and `--ws-server` flags. You can also connect to existing servers with the `-c` and `--ws-client` flags. This opens some interesting use-cases. For example you could start a proxy server in headless-mode (default) and connect to it with the text mode client.

```sh
$ pown proxy -s
* proxy listening on :::8080
* web socket listening on 0.0.0.0:9090
! connect to ws://127.0.0.1:9090
```

```sh
$ pown proxy -c ws://127.0.0.1:9090 -t
```

## Improvements

While Pown Proxy is a great tool it still requires some work to be truly amazing. In no particular order here is the current wish list:

* Extension system so that additional features can be added with the help of user-supplied modules.
* Active interception feature (already possible but no UI)
* Request reply feature (already possible but no UI)

## Credits

This tool will not be possible without the awesome Open Source community that exists around Node.js. However, all of this work is heavily inspired and in many cases directly borrowed from SecApps' HTTPView.
