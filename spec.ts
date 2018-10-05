import { Foglet } from 'foglet-core'

abstract class Network {
  public static create (): Network {
    throw new SyntaxError('A valid Network must implements a create method')
  }

  public abstract getNeighbours (): string[];

  public abstract send (id: string, message: any): Promise<void>;

  public abstract receive (id: string, message: any): void;

  public abstract connect (network?: Network): Promise<void>;

  public abstract disconnect (): Promise<void>;
}

abstract class Module {
  public static create (network: Network): Module {
    throw new SyntaxError('A valid Network must implements a create method')
  }
}

class Cyclon extends Network {}

class FifoUnicast extends Module {}

const f = new Foglet()

f.addNetwork('default', Cyclon)
f.network('default').use('fu', FifoUnicast)

f.network('default').module('fu').send('toto')
f.get('default.fu').send('toto')
