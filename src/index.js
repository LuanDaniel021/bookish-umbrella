
const express = require('express');
const cors = require('cors');

const app = express();
const remoteApiUrl = 'https://fictional-memory-31a3.onrender.com/api'.replace(/\/$/, '');

app.use( cors() );

app.use('/api', async (req, res) => {
    try {
        const targetUrl = `${remoteApiUrl}${req.originalUrl.slice('/api'.length)}`;
        const headers = new Headers(req.headers);

        headers.delete('host');
        headers.delete('content-length');

        const hasBody = !['GET', 'HEAD'].includes(req.method);
        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: hasBody ? await readRequestBody(req) : undefined,
        });

        res.status(response.status);
        response.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key)) {
                res.setHeader(key, value);
            }
        });
        res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
        res.status(502).json({ message: 'Nao foi possivel acessar a API.', error: error.message });
    }
});

app.use(
    express.json()
);

app.use(
    express.static('public')
);

app.listen(
    3000, () => console.log('Server is running on port 3000')
);

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => resolve(Buffer.concat(chunks)));
        request.on('error', reject);
    });
}
