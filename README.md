# Distributed Universe

A assignment to Distributed Systems class @ UFFS

## Proposal

Implement a "Travian-like" game themed on universe. Each player can have its own planet and upgrade
three main skills:

 - Attack
 - Defense
 - Health

The servers will need to run in distributed manner, and sync states.

## Communication

Servers communicate by HTTP via a JSON REST API.

## Features

 - Peer discovery and synchronization
 - Fail state recovery from servers that crash
 - Vector-clock message sync

# Config

TODO

## Endpoints

TODO

## Debug

You might want to use Postman, so there is a basic collection with some endpoints in
`distunivers.postman_collection.json`.

## Warns

Due to evolution on Node.js knowledge and tooling around project, right now the code is kinda messy.
Probably I will work more on that later

The "frontend" client will soon be available.
