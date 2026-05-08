#!/bin/bash

# Test upload on production with detailed output
# Usage: ./scripts/test-production-upload.sh [production-url]

PROD_URL="${1:-https://anatomi-q.vercel.app}"
ADMIN_KEY="${ADMIN_UPLOAD_KEY:-19/BM/ANM/617/2204}"

echo "🧪 Testing production upload endpoint"
echo "URL: $PROD_URL/api/upload-material"
echo ""

# Create a minimal test PDF
TEST_PDF=$(mktemp --suffix=.pdf)
cat > "$TEST_PDF" << 'EOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
206
%%EOF
EOF

echo "1️⃣  Created test PDF: $TEST_PDF"
echo ""

echo "2️⃣  Sending upload request..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$PROD_URL/api/upload-material" \
  -H "x-admin-upload-key: $ADMIN_KEY" \
  -F "file=@$TEST_PDF;type=application/pdf" \
  -F "title=Test Upload $(date +%s)" \
  -F "courseName=Human Anatomy" \
  -F "topicName=Test Topic" \
  -F "subtopicName=Test Subtopic")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
echo "3️⃣  Response:"
echo "   Status Code: $HTTP_CODE"
echo "   Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

rm -f "$TEST_PDF"

echo ""
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Upload successful!"
  exit 0
else
  echo "❌ Upload failed with status $HTTP_CODE"
  echo ""
  echo "📋 Next steps:"
  echo "1. Go to Vercel dashboard: https://vercel.com"
  echo "2. Select your project"
  echo "3. Go to 'Functions' tab"
  echo "4. Find the /api/upload-material function"
  echo "5. Look for logs with [upload-material] or [materials] prefix"
  echo "6. Share the full error message and stack trace"
  exit 1
fi
