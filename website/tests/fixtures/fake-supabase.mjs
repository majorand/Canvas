import { randomUUID } from 'node:crypto';
export function fakeSupabase() {
  const tables = { site_accounts: [], site_sessions: [], site_access_events: [], site_rate_limits: [] };
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
              const incoming = (Array.isArray(values) ? values : [values]).map(value => ({ activated: true, enabled: true, created_at: new Date(time).toISOString(), ...value }));
              if (table === 'site_accounts' && incoming.some(value => rows.some(row => row.email === value.email))) return result(null, new Error('unique')).then(resolve,reject);
              rows.push(...structuredClone(incoming)); selected = incoming;
            } else if (operation === 'update') { selected.forEach(row => Object.assign(row, structuredClone(values))); }
            else if (operation === 'delete') {
              const removed = new Set(selected.map(row => row.token_hash));
              tables[table] = rows.filter(row => !selected.includes(row) && !(table === 'site_sessions' && removed.has(row.parent_hash)));
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
        if (!session || !account?.enabled || !account.activated || (args.p_kind === 'admin' && account.role !== 'admin') || (args.p_kind === 'relay' && !parent)) return { data: null };
        return { data: { id: account.id, email: account.email, display_name: account.display_name, role: account.role, expires_at: session.expires_at } };
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
