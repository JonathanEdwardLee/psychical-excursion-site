import "fake-indexeddb/auto";

if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:pex-test";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {};
}
