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

Pown Proxy comes with intriguing text-based user interface. The interface resembles popular security tools like Burp, ZAP and SecApps's HTTPView, but only utilizing console capabilities such as ANSI escape sequences.

![](./screenshots/Screenshot 2018-12-14 at 23.09.58.png)
![](./screenshots/Screenshot 2018-12-14 at 23.12.22.png)
![](./screenshots/Screenshot 2018-12-14 at 23.12.35.png)
