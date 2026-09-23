// Isolated browser-test fixture. Never used by production endpoints.
import { fakeSupabase } from './fixtures/fake-supabase.mjs';
import { createAccessService } from '../lib/access.mjs';
import { createAccessHandler } from '../api/access.js';
import { createUpgrade } from '../lib/relay.mjs';
import { createAppServer } from '../server.mjs';
const fake = fakeSupabase();
const service = createAccessService({ ...fake, ownerEmail:'owner@example.test', siteUrl:'http://localhost:3032/' });
await service.dispatch('setup',{email:'owner@example.test'},'','local');
const owner=[...fake.identities.values()][0];
await service.dispatch('complete-setup',{accessToken:owner.id,password:'owner-test-password-123'},'','local');
const admin=await service.dispatch('login',{email:owner.email,password:'owner-test-password-123',admin:true},'','local');
await service.dispatch('create-user',{email:'member@example.test',name:'Test member',password:'member-test-password-123'},admin.token,'local');
const server=createAppServer({
  apiHandler:createAccessHandler(()=>service),
  upgradeHandler:createUpgrade(async req=>{
    const token=new URL(req.url,'http://localhost').searchParams.get('ticket');
    const user=await service.authorize(token,'relay');
    return {expiresAt:user.expires_at,revalidate:()=>service.authorize(token,'relay')};
  }),
});
server.listen(3032,'127.0.0.1',()=>console.log('Isolated account UI test at http://localhost:3032'));
