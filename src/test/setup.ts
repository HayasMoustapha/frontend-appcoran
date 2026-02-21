import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import i18n from "../app/i18n";

vi.stubGlobal("fetch", vi.fn());

const createObjectURL = vi.fn(() => "blob:mock");
const revokeObjectURL = vi.fn();

if (!("createObjectURL" in URL)) {
  Object.defineProperty(URL, "createObjectURL", {
    value: createObjectURL,
    writable: true
  });
} else {
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
}

if (!("revokeObjectURL" in URL)) {
  Object.defineProperty(URL, "revokeObjectURL", {
    value: revokeObjectURL,
    writable: true
  });
}

if (!HTMLMediaElement.prototype.load) {
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    value: vi.fn(),
    writable: true
  });
} else {
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
}

if (!HTMLMediaElement.prototype.play) {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    value: vi.fn(() => Promise.resolve()),
    writable: true
  });
} else {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
}

if (!HTMLMediaElement.prototype.pause) {
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    value: vi.fn(),
    writable: true
  });
} else {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
}

i18n.changeLanguage("fr");
