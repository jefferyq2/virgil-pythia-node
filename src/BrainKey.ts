import { PythiaClient } from './PythiaClient';
import { PythiaCrypto } from './PythiaCrypto';
import { Data } from './types';

export class BrainKey {
  private readonly pythiaCrypto: PythiaCrypto;
  private readonly pythiaClient: PythiaClient;

  constructor(pythiaCrypto: PythiaCrypto, pythiaClient: PythiaClient) {
    if (pythiaCrypto == null) {
      throw new Error('`pythiaCrypto` is required');
    }
    if (pythiaClient == null) {
      throw new Error('`pythiaClient` is required');
    }
    this.pythiaCrypto = pythiaCrypto;
    this.pythiaClient = pythiaClient;
  }

  async generateKeyPair(password: Data, brainKeyId?: string) {
    const { blindedPassword, blindingSecret } = this.pythiaCrypto.blind(password);
    const seed = await this.pythiaClient.generateSeed(blindedPassword, brainKeyId);
    const deblindedPassword = this.pythiaCrypto.deblind(seed, blindingSecret);
    return this.pythiaCrypto.generateKeyPair(deblindedPassword);
  }
}
