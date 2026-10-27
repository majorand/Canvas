import { requestPublic } from '../lib/video-sources.mjs';
// Fixed test endpoints published in Render's advisory; no client-supplied URLs.
const endpoints=['https://dv-g3b-emudhra.we-have-a-problem.com/','https://dv-g3b-aaa-emudhra.we-have-a-problem.com/'];
const rejectedCodes=new Set(['CERT_REVOKED','CERT_REJECTED','CERT_UNTRUSTED','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','DEPTH_ZERO_SELF_SIGNED_CERT']);
export function tlsFailure(error){
  let code;for(let item=error;item;item=item.cause){if(item.code){code=item.code;break;}}
  return {status:error.status?'accepted':rejectedCodes.has(code)?'rejected':'inconclusive',code:code || (error.status?'HTTP_'+error.status:error.name || 'UNKNOWN')};
}
export async function verifyTlsDistrust({fetchClient=url=>fetch(url,{redirect:'manual',signal:AbortSignal.timeout(6000)}),httpsClient=url=>requestPublic(url,6000),log=console.log}={}){
  const checks=await Promise.all(endpoints.flatMap(url=>[['fetch',fetchClient],['https',httpsClient]].map(async([client,request])=>{
    try{const response=await request(url);await response?.body?.cancel?.();return {client,host:new URL(url).hostname,status:'accepted'};}
    catch(error){return {client,host:new URL(url).hostname,...tlsFailure(error)};}
  })));
  const status=checks.every(c=>c.status==='rejected')?'passed':checks.some(c=>c.status==='accepted')?'FAILED':'inconclusive';
  log('TLS distrust verification '+JSON.stringify({node:process.versions.node,status,checks}));return {status,checks};
}
