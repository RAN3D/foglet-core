module.exports = {
  notYetImplemented: (message, error) => new Error('Not yet implemented: ' + message, error),
  moduleAlreadyDefined: (moduleName, networkName) => new Error(`Module ${moduleName} already defined in network: ${networkName}`),
  networkAlreadyDefined: (networkName) => new Error(`Network ${networkName} already defined `),
  peerNotFound: (peerId, error) => new Error('Peer not found: ' + peerId, error)
}
