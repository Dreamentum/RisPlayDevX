# 🔐 OCI Signer Proxy for Oracle Cloud APIs

This project securely signs HTTP requests to [Oracle Cloud Infrastructure (OCI)](https://www.oracle.com/cloud/) services using your private key, allowing you to call OCI APIs (like AI Document Analysis) from frontend clients that can't perform RSA signing.

## 🚀 Features

- ✅ Secure server-side signing for OCI API calls
- ✅ Supports `objectstorage`, `document.aiservice`, `language`, and more
- ✅ Supports `TEXT_EXTRACTION` response parsing (for OCR)
- ✅ Powered by `node-forge`, `axios`, and `Next.js` API routes
- ✅ Ready to deploy to Vercel, Netlify, etc.

---

## 🔧 .env Configuration

Create a `.env` file with the following variables:

```env
OCI_TENANCY_OCID=ocid1.tenancy.oc1...
OCI_USER_OCID=ocid1.user.oc1...
OCI_FINGERPRINT=xx:xx:xx...
OCI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABCDEF...\n-----END PRIVATE KEY-----"
OCI_REGION=ap-sydney-1

⚠️ Your OCI_PRIVATE_KEY must be escaped as a single-line string with \n in place of line breaks.

⸻

✉️ API: /api/sign-oci

POST Request

POST /api/sign-oci
Content-Type: application/json

Request Body:

{
  "method": "POST",
  "path": "/20221109/actions/analyzeDocument",
  "service": "document.aiservice",
  "host": "oci.oraclecloud.com",
  "body": {
    "features": [{ "featureType": "TEXT_EXTRACTION" }],
    "document": {
      "source": "INLINE",
      "data": "<base64-encoded-image>"
    }
  }
}

Response:

{
  "status": 200,
  "statusText": "OK",
  "data": {
    "documentMetadata": { "pageCount": 1 },
    "pages": [ ... ],
    "rawText": "Line 1\nLine 2\n..."
  }
}


⸻

🧠 How It Works
	•	Builds a canonical OCI signing string from method, host, date
	•	Signs it using node-forge or crypto
	•	Attaches signature to headers
	•	Proxies the request to Oracle AI APIs
	•	Returns the full API response + optional raw OCR lines

⸻

✅ Use Cases
	•	🔍 Extract text from invoices using TEXT_EXTRACTION
	•	🤖 Let chatbots send user-uploaded images for analysis
	•	🔐 Protect your OCI credentials from frontend exposure
	•	🧪 Test Oracle APIs in Postman without local signing hacks

⸻

🔐 Security Notes
	•	Never expose your .env or private key to the client
	•	Use environment-level secrets in Vercel or your host
	•	Consider adding auth tokens or IP filtering for production