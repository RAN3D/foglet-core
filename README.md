Foglet-core
===========

[![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=v6)](https://travis-ci.org/RAN3D/foglet-core/branches)[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

The version 6.0.0 is a complete rework of the library.
Rebuilt from zero with a minimum of dependencies.
Pure JavaScript.
Made to work either with WebRTC or any other communication protocol.

# What is a foglet?

Good question, a foglet is the application created with `foglet-core`. It's also a p2p-first application. `foglet-core` includes a peer (you) which can communicate with other peers using the same application.
The main goal of the project is to provide network creation (with maintenance) protocols on top of different communication protocols (such as WebRTC, HTTP, TCP, etc...).
I mean, you can easily create a fully-connected network (a clique) in 2 minutes.
And if you want to scale, switch the full-connected protocol by a Random Peer Sampling protocol (eg: [Cyclon]() or [Spray]())

You want more details? Continue to read the README or ask questions in issues.
# Table of contents
* [Installation](#installation)
* [Getting started](#getting-started)
  * [Local connections between two peers](#local-connections-between-two-peers)
  * [Fully connected network with 20 peers](#fully-connected-network-with-20-peers)
* [Documentation](#documentation)

# Installation

```bash
yarn add foglet-core
```
or
```bash
git clone https://github.com/folkvir/foglet-core.git
cd foglet-core/
yarn install
# if you are a user of npm do:
npm install -g yarn && yarn install
```

# Getting started

## Local connections between two peers
There is no communication protocol here. It's totally local to your script.
```js
// TODO:
```

The same thing using **WebRTC Data channels** this time
```js
// TODO:
```

## Fully connected network with 20 peers
Local version
```js
// TODO:
```

# Documentation

## Table of contents

* [Networks](#networks)
  * [Fully Connected (clique)](#fully-connected-(clique))
  * [Random Peer Sampling protocols](#random-peer-sampling-protocols)
    * [Cyclon](#cyclon)
    * [Spray](#spray)
  * [Building custom overlay networks](#building-custom-overlay-networks)
    * [T-Man](#t-man)
* [Communication Layers](#communication-layers)
  * [Local](#local)
  * [WebRTC](#webrtc)
  * [Http](#http)
  * [Tcp](#tcp)
  * [Build a custom communication layer](#)
* [Signaling services](#signaling-services)
  * [Local Signaling](#local-signaling)
  * [Signaling Server](#signaling-server)
* [Miscellaneous](#miscellaneous)
  * [Global options](#global-options)
  * [Tests](#tests)
  * [Difference between the layers](#difference-between-the-layers)
  * [Multiple networks but multiple layers](#multiple-networks-but-multiple-layers)
  * [Why views are locked?](#why-views-are-locked?)
  * [The lovers' problem](#the-lovers'-problem)
  * [Modules](#modules)
    * [data chunks](#data-chunks)
    * [data streams](#data-streams)
    * [broadcast methods](#broadcast-methods)
