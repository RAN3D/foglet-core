# Broadcast mechanism

This broadcast is a causal broadcast by default with no anti-entropy mechanism.

We provide one but this mechanism is not activated by default.

```javascript
var foglet = new Foglet({...});
// will active antiantropy mechanism every 30 seconds
foglet.getNetwork().communication.broadcast.startAntiEntropy(30000);

// now listen on the event antiEntropy to retreive old messages
foglet.getNetwork().communication.broadcast.on('antiEntropy', (id, messageCausality, ourCausality) => {
  // do what you want...
  // by default there is a debug of all variables.
  // A warning is printed if you do not override this callback.
})

// stop the mechanism
foglet.getNetwork().communication.broadcast.clearAntiEntropy();
```
