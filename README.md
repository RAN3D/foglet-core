# foglet-core [![Build Status](https://travis-ci.org/folkvir/foglet-core.svg?branch=master)](https://travis-ci.org/folkvir/foglet-core) [![Coverage Status](https://coveralls.io/repos/github/folkvir/foglet-core/badge.svg?branch=master)](https://coveralls.io/github/folkvir/foglet-core?branch=master) [![XirSys WebRTC Cloud Support](https://img.shields.io/badge/XirSys%20Cloud-used-blue.svg)](http://xirsys.com/)
Core of the foglet library

This project aims to provide a solid core infrastructure built with spray-wrtc (see references)

## References

**T. Minier** alias [Callidon](https://github.com/Callidon) :  for contributions on ES6 references and testing tools.

**Chat-Wane** :
Keywords: Random peer sampling, adaptive, browser-to-browser communication, WebRTC

This project aims to provide a WebRTC implementation of Spray.

Spray is a random peer sampling protocol [1] inspired by both Cyclon [2] and Scamp [3]. It adapts the partial view of each member to the network size using local knowledge only. Therefore, without any configurations, each peer automatically adjust itself to the need of the network.

https://github.com/Chat-Wane/spray-wrtc/

[1] M. Jelasity, S. Voulgaris, R. Guerraoui, A.-M. Kermarrec, and M. Van Steen. Gossip-based peer sampling. ACM Transactions on Computer Systems (TOCS), 25(3):8, 2007.

[2] S. Voulgaris, D. Gavidia, and M. van Steen. Cyclon: Inexpensive membership management for unstructured p2p overlays. Journal of Network and Systems Management, 13(2):197–217, 2005.

[3] A. Ganesh, A.-M. Kermarrec, and L. Massoulié. Peer-to-peer membership management for gossip-based protocols. IEEE Transactions on Computers, 52(2):139–149, Feb 2003.

[4] A. Montresor and M. Jelasity. Peersim: A scalable P2P simulator. Proc. of the 9th Int. Conference on Peer-to-Peer (P2P’09), pages 99–100, Seattle, WA, Sept. 2009.
