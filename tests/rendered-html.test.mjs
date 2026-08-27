import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the FHS cart reservation experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>FHS Science \| Laptop Cart Reservations<\/title>/i);
  assert.match(html, /Reserve a <em>laptop cart/i);
  assert.match(html, /Cart #1/);
  assert.match(html, /Behind Room 245/);
  assert.match(html, /Cart #2/);
  assert.match(html, /Between Rooms 150 &amp; 152/);
  assert.match(html, /Return and plug in/);
  assert.match(html, /Help Desk request/);
  assert.doesNotMatch(html, /Keep learning moving|Example: 232/i);
  assert.match(html, /Preview mode/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
