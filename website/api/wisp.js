import http from 'node:http';
import { upgrade, health } from '../lib/relay.mjs';
const server = http.createServer(health);
server.on('upgrade', upgrade);
export default server;
