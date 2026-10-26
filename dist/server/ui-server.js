import http from 'node:http';
import open from 'open';
import pc from 'picocolors';
import { getDashboardHtml } from './web-template.js';
export function startUiServer(result, port = 4880) {
    return new Promise((resolve, reject) => {
        const htmlContent = getDashboardHtml(result);
        const server = http.createServer((req, res) => {
            if (req.url === '/api/data') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return;
            }
            // Default route
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(htmlContent);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Try next port
                server.listen(port + 1);
            }
            else {
                reject(err);
            }
        });
        server.listen(port, () => {
            const address = server.address();
            const actualPort = typeof address === 'object' && address ? address.port : port;
            const url = `http://localhost:${actualPort}`;
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
