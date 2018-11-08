module.exports = {
  notYetImplemented: (message, error) => new Error('Not yet implemented: ' + message, error),
  moduleAlreadyDefined: (moduleName, networkName) => new Error(`Module ${moduleName} already defined in network: ${networkName}`),
  peerNotFound: (peerId, error) => new Error('Peer not found: ' + peerId, error)
}
