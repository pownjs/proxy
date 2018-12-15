[![Follow on Twitter](https://img.shields.io/twitter/follow/pownjs.svg?logo=twitter)](https://twitter.com/pownjs)

# Pown Proxy

Pown Proxy is a versatile web debugging proxy. You can use the proxy to monitor, intercept and investigate web traffic in active or passive mode.

## Quickstart

Install this module from the root of your project:

```sh
$ npm install @pown/proxy --save
```

Once done, invoke pown proxy like this:

```sh
$ ./node_modules/.bin/pown-cli proxy
```

If installed globally or as part of Pown.js distribution invoke like this:

```sh
$ pown proxy
```

## Usage

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
  --ws, -s                  Forward on web socket     [boolean] [default: false]
  --ws-host                 Web socket host        [string] [default: "0.0.0.0"]
  --ws-port                 Web socket port             [number] [default: 9090]
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

## Web Socket Mode

Pown Proxy provides a handy web-sockets interface backed by a simple binary protocol to interface with other tools, thus allowing it to be used as a backend proxy service. This technique is used to power tools such as SecApps' HTTPView.

The Web Socket Mode can be accessed via the `-s` and `--ws` flags.

## Improvements

While Pown Proxy is a great tool it still requires some work to be truly amazing. In no particular order here is the current wish list:

* The ability to integrate to one or many web socket servers like SecApps' HTTPView.
* Extension system so that additional features can be added with the help of user-supplied modules.
* Active interception feature (already possible but no UI)
* Reply feature

## Credits

This tool will not be possible without the awesome Open Source community that exists around Node.js. However, all of this work is heavily inspired and in many cases directly borrowed from SecApps' HTTPView.
