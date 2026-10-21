import { randomUUID } from 'node:crypto';
export function fakeSupabase() {
  const tables = { site_accounts: [], site_sessions: [], site_access_events: [], site_rate_limits: [], site_activity: [], site_workspace_tabs: [], site_settings: [{ id:true,activity_logging:true,retention_days:30,games_enabled:true,maintenance_enabled:false,maintenance_message:'Workspace paused.',session_hours:4,session_limit:10 }] };
  const identities = new Map(); let time = Date.now();
  function result(data, error = null) { return Promise.resolve({ data, error }); }
  const admin = {
    createUser: async fields => {
      if ([...identities.values()].some(user => user.email === fields.email)) return { error: { message: 'exists' }, data: {} };
      const user = { id: randomUUID(), ...fields, email_confirmed_at: new Date(time).toISOString() };
      identities.set(user.id, user); return { data: { user } };
    },
    inviteUserByEmail: async email => admin.createUser({ email, password: 'unusable-invite-password' }),
    updateUserById: async (id, fields) => { Object.assign(identities.get(id), fields); return { data: { user: identities.get(id) } }; },
    deleteUser: async id => { identities.delete(id); return { data: {} }; },
  };
  const db = {
    auth: { admin, getUser: async token => ({ data: { user: identities.get(token) }, error: identities.has(token) ? null : new Error('invalid') }) },
    from(table) {
      let operation = 'select', values, fields = '*', single = false, count, descending, orderField;
      const filters = [];
      const builder = {
        select(value = '*') { fields = value; return this; },
        insert(value) { operation = 'insert'; values = value; return this; },
        update(value) { operation = 'update'; values = value; return this; },
        delete() { operation = 'delete'; return this; },
        eq(key, value) { filters.push(row => row[key] === value); return this; },
        gte(key, value) { filters.push(row => row[key] >= value); return this; },
        maybeSingle() { single = true; return this; },
        order(key, options) { orderField = key; descending = options.ascending === false; return this; },
        limit(value) { count = value; return this; },
        then(resolve, reject) {
          try {
            const rows = tables[table];
            let selected = rows.filter(row => filters.every(filter => filter(row)));
            if (operation === 'insert') {
              const incoming = (Array.isArray(values) ? values : [values]).map(value => ({ id:randomUUID(), activated: true, enabled: true, can_browse:true,can_play:true,access_expires_at:null,created_at: new Date(time).toISOString(), ...value }));
              if (table === 'site_accounts' && incoming.some(value => rows.some(row => row.email === value.email))) return result(null, new Error('unique')).then(resolve,reject);
              if (table === 'site_sessions' && incoming.some(value => value.kind === 'member' && tables.site_accounts.find(a=>a.id===value.user_id)?.role !== 'admin' && rows.filter(s=>s.user_id===value.user_id && s.kind==='member' && new Date(s.expires_at).getTime()>time).length >= tables.site_settings[0].session_limit)) return result(null,{message:'session_limit'}).then(resolve,reject);
              rows.push(...structuredClone(incoming)); selected = incoming;
            } else if (operation === 'update') { selected.forEach(row => Object.assign(row, structuredClone(values))); }
            else if (operation === 'delete') {
              const removed = new Set(selected.map(row => row.token_hash));
              tables[table] = rows.filter(row => !selected.includes(row) && !(table === 'site_sessions' && removed.has(row.parent_hash)));
              if (table === 'site_sessions') tables.site_workspace_tabs = tables.site_workspace_tabs.filter(t=>!removed.has(t.session_hash));
            }
            if (orderField) selected.sort((a,b) => String(a[orderField]).localeCompare(String(b[orderField])) * (descending ? -1 : 1));
            if (count) selected = selected.slice(0,count);
            const data = selected.map(row => fields === '*' ? row : Object.fromEntries(fields.split(',').map(key => [key,row[key]])));
            return result(structuredClone(single ? data[0] || null : data)).then(resolve,reject);
          } catch(error) { return Promise.reject(error).then(resolve,reject); }
        },
      }; return builder;
    },
    async rpc(name, args = {}) {
      if (name === 'site_allow_attempt') {
        tables.site_rate_limits = tables.site_rate_limits.filter(row => row.expires > time);
        let row = tables.site_rate_limits.find(row => row.key === args.p_key);
        if (!row) { row = { key: args.p_key, attempts: 0, expires: time + args.p_seconds * 1000 }; tables.site_rate_limits.push(row); }
        return { data: ++row.attempts <= args.p_limit };
      }
      if (name === 'site_authorize_session') {
        const session = tables.site_sessions.find(row => row.token_hash === args.p_hash && row.kind === args.p_kind && new Date(row.expires_at).getTime() > time);
        const account = tables.site_accounts.find(row => row.id === session?.user_id);
        const parent = tables.site_sessions.find(row => row.token_hash === session?.parent_hash && row.kind === 'member' && new Date(row.expires_at).getTime() > time && row.user_id === account?.id);
        const blocked = account?.role !== 'admin' && ((account?.access_expires_at && new Date(account.access_expires_at).getTime() <= time) || (args.p_kind === 'relay' && (!account?.can_browse || tables.site_settings[0].maintenance_enabled)));
        if (!session || !account?.enabled || !account.activated || blocked || (args.p_kind === 'admin' && account.role !== 'admin') || (args.p_kind === 'relay' && !parent)) return { data: null };
        return { data: { id: account.id, email: account.email, display_name: account.display_name, role: account.role, can_browse:account.can_browse,can_play:account.can_play,expires_at: session.expires_at } };
      }
      if (name === 'site_touch_tab') {
        const session = tables.site_sessions.find(s=>s.token_hash===args.p_hash);
        const existing = tables.site_workspace_tabs.find(t=>t.id===args.p_id);
        const values = {feature:args.p_feature,visible:args.p_visible,last_seen_at:new Date(time).toISOString()};
        if (!existing) tables.site_workspace_tabs.push({id:args.p_id,session_hash:args.p_hash,user_id:session.user_id,...values});
        else if(existing.session_hash===args.p_hash) Object.assign(existing,values);
        return {data:null};
      }
      if (name === 'site_admin_stats') {
        const tabs=tables.site_workspace_tabs.filter(t=>new Date(t.last_seen_at).getTime()>time-120000);
        return {data:{sessions:tables.site_sessions.filter(s=>s.kind==='member' && new Date(s.expires_at).getTime()>time).length,active_tabs:tabs.length,online_accounts:new Set(tabs.map(t=>t.user_id)).size,searches_today:tables.site_activity.filter(a=>a.kind==='search' && a.created_at.slice(0,10)===new Date(time).toISOString().slice(0,10)).length}};
      }
      if (name === 'site_cleanup') return { data: null };
      throw new Error('Unexpected RPC: ' + name);
    },
  };
  const authClient = () => ({ auth: {
    signInWithPassword: async ({email,password}) => {
      const user = [...identities.values()].find(user => user.email === email && user.password === password);
      return { data: { user }, error: user ? null : new Error('invalid') };
    },
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
  } });
  return { db, authClient, tables, identities, now: () => time, advance: ms => { time += ms; } };
}
