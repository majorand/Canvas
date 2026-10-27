import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyTlsDistrust,tlsFailure} from '../scripts/verify-tls.mjs';
test('TLS verification distinguishes certificate rejection from network failure or accepted HTTP',async()=>{
  assert.equal(tlsFailure({cause:{code:'CERT_REJECTED'}}).status,'rejected');
  assert.equal(tlsFailure({code:'CERT_REVOKED'}).status,'rejected');
  assert.equal(tlsFailure({code:'ENOTFOUND'}).status,'inconclusive');
  assert.equal(tlsFailure({status:403}).status,'accepted');
  const reject=async()=>{throw Object.assign(new Error('fixture'),{code:'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'});};
  assert.equal((await verifyTlsDistrust({fetchClient:reject,httpsClient:reject,log(){}})).status,'passed');
  assert.equal((await verifyTlsDistrust({fetchClient:async()=>({status:403}),httpsClient:reject,log(){}})).status,'FAILED');
  const network=async()=>{throw Object.assign(new Error('fixture'),{code:'ETIMEDOUT'});};
  assert.equal((await verifyTlsDistrust({fetchClient:network,httpsClient:reject,log(){}})).status,'inconclusive');
});
