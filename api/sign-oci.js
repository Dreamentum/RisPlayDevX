import forge from 'node-forge';
import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const {
      method,
      path,
      body,
      service = 'objectstorage',
      host: domain = 'oraclecloud.com',
      region = 'ap-singapore-1'
    } = req.body || {};

    if (!method || !path) {
      return res.status(400).json({ error: 'Missing required fields: method and path' });
    }

    const keyId = `${process.env.OCI_TENANCY_OCID}/${process.env.OCI_USER_OCID}/${process.env.OCI_FINGERPRINT}`;
    const privateKeyPem = process.env.OCI_PRIVATE_KEY.replace(/\\n/g, '\n').trim();

    const fullHost = `${service}.${region}.${domain}`;
    const date = new Date().toUTCString();

    const headersToSign = ['(request-target)', 'date', 'host'];
    const signingStringArray = [
      `(request-target): ${method.toLowerCase()} ${path}`,
      `date: ${date}`,
      `host: ${fullHost}`
    ];

    const headers = {
      'Date': date,
      'Host': fullHost
    };

    // Include headers if body is present and applicable
    let contentLength = 0;
    let bodyString = '';

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      bodyString = JSON.stringify(body);
      contentLength = Buffer.byteLength(bodyString);
      const contentType = 'application/json';

      const hashHex = crypto.createHash('sha256').update(bodyString, 'utf8').digest('hex');
      const sha256base64 = Buffer.from(hashHex, 'hex').toString('base64');

      headers['Content-Type'] = contentType;
      headers['Content-Length'] = contentLength.toString();
      headers['x-content-sha256'] = sha256base64;

      signingStringArray.push(`x-content-sha256: ${sha256base64}`);
      signingStringArray.push(`content-type: ${contentType}`);
      signingStringArray.push(`content-length: ${contentLength}`);

      headersToSign.push('x-content-sha256', 'content-type', 'content-length');
    }

    const signingString = signingStringArray.join('\n');

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = forge.md.sha256.create();
    md.update(signingString, 'utf8');
    const signature = forge.util.encode64(privateKey.sign(md, 'RSASSA-PKCS1-V1_5'));

    headers['Authorization'] = `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="${headersToSign.join(' ')}",signature="${signature}"`;

    const url = `https://${fullHost}${path}`;
    console.log('🔗 Fetching:', url);

    const oracleRes = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined
    });

    const rawTextResponse = await oracleRes.text();
    const contentType = oracleRes.headers.get('content-type');
    const result = contentType?.includes('application/json')
      ? JSON.parse(rawTextResponse)
      : rawTextResponse;

    // 🔍 Check if TEXT_EXTRACTION requested
    let textExtracted = null;
    if (body?.features?.some(f => f.featureType === 'TEXT_EXTRACTION') && result?.pages) {
      textExtracted = extractTextLinesFromOCR(result);
    }

    res.status(oracleRes.status).json({
      status: oracleRes.status,
      statusText: oracleRes.statusText,
      data: result,
      rawText: textExtracted
    });

  } catch (err) {
    console.error('[SIGN OCI ERROR]', err);
    res.status(500).json({
      error: 'Request failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// 🔍 OCR Text Extraction Logic
function extractTextLinesFromOCR(response) {
  if (!response?.pages?.length) return '';

  const lines = [];

  response.pages.forEach(page => {
    const wordGroups = {};

    page.words?.forEach(word => {
      const y = word.boundingPolygon?.normalizedVertices?.[0]?.y || 0;
      const yBucket = y.toFixed(2);

      if (!wordGroups[yBucket]) {
        wordGroups[yBucket] = [];
      }

      wordGroups[yBucket].push({
        text: word.text,
        x: word.boundingPolygon?.normalizedVertices?.[0]?.x || 0
      });
    });

    const sortedY = Object.keys(wordGroups).sort((a, b) => parseFloat(a) - parseFloat(b));

    sortedY.forEach(yKey => {
      const lineWords = wordGroups[yKey].sort((a, b) => a.x - b.x);
      const line = lineWords.map(w => w.text).join(' ');
      lines.push(line);
    });
  });

  return lines.join('\n');
}