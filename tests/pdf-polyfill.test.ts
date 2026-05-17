import { extractMaterialText } from "../src/lib/ai/extractors";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("PDF Extraction Polyfills", () => {
  it("should apply polyfills and import pdf-parse without crashing", async () => {
    // We don't need a real PDF to test if the import and polyfills work
    // We just need to trigger the part of the code that does the import
    
    const buffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");
    
    try {
      // This will likely fail with "Invalid PDF" but it should NOT fail with "DOMMatrix is not defined"
      await extractMaterialText({
        buffer,
        fileName: "test.pdf",
        mimeType: "application/pdf"
      });
    } catch (error: any) {
      console.log("Caught expected error:", error.message);
      assert.ok(!error.message.includes("DOMMatrix"), "Should not fail due to missing DOMMatrix");
      assert.ok(!error.message.includes("ImageData"), "Should not fail due to missing ImageData");
      assert.ok(!error.message.includes("Path2D"), "Should not fail due to missing Path2D");
    }
  });
});
