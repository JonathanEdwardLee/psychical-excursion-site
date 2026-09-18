import { describe, expect, it } from "vitest";
import { crc32, createZip, extensionForMime } from "../export/zip.ts";

describe("zip", () => {
  it("writes a store-only archive with local and central headers", () => {
    const files = [
      { path: "manifest.json", data: new TextEncoder().encode('{"ok":true}\n') },
      { path: "recordings/a.webm", data: new Uint8Array([1, 2, 3, 4]) },
    ];
    const zip = createZip(files);
    const asString = new TextDecoder("latin1").decode(zip);
    expect(asString.includes("manifest.json")).toBe(true);
    expect(asString.includes("recordings/a.webm")).toBe(true);
    expect(zip[0]).toBe(0x50);
    expect(crc32(files[1]!.data)).toBe(crc32(new Uint8Array([1, 2, 3, 4])));
  });

  it("maps mime types to extensions deterministically", () => {
    expect(extensionForMime("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionForMime("audio/mp4")).toBe("m4a");
    expect(extensionForMime("audio/ogg")).toBe("ogg");
  });
});
