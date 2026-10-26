import http from 'node:http';
import open from 'open';
import pc from 'picocolors';
import { ReviewResult } from '../types.js';
import { getDashboardHtml } from './web-template.js';

export function startUiServer(result: ReviewResult, port = 4880): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      reject(new Error('Dashboard port must be an integer between 1 and 65535.'));
      return;
    }
    const htmlContent = getDashboardHtml(result);

    const server = http.createServer((req, res) => {
      const host = req.headers.host ?? '';
      if (host !== '127.0.0.1' && !/^127\.0\.0\.1:\d+$/.test(host)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      res.setHeader('X-Frame-Options', 'DENY');
      if (req.method !== 'GET') {
        res.writeHead(405, { Allow: 'GET' });
        res.end('Method not allowed');
        return;
      }

      if (req.url === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      if (req.url !== '/') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        server.listen(port + 1, '127.0.0.1');
      } else {
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      const url = `http://127.0.0.1:${actualPort}`;

      console.log('');
      console.log(pc.bold(pc.green(`🚀 Interactive Web Dashboard running at:`)) + ' ' + pc.underline(pc.cyan(url)));
      console.log(pc.dim(`   (Press Ctrl+C in terminal when finished to stop dashboard server)`));
      console.log('');

      // Open browser
      open(url).catch(() => {
        // Ignore browser launch errors in headless environments
      });

      resolve(server);
    });
  });
}
