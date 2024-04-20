import { describe, expect, it, type Mock, vi } from "vitest";
import { Action } from "./action.js";
import { Compiler } from "./compiler.js";

vi.mock("./compiler.js", () => {
  const C = vi.fn();
  C.prototype.compile = vi.fn();
  return { Compiler: C };
});

describe("action", () => {
  it("should call compiler's compile method", () => {
    const action = new Action({
      watch: false,
      project: "tsconfig.json",
      remove: false,
      copyfiles: false,
    });
    action.start();

    expect((Compiler as Mock).mock.instances.length).toBe(1);
    expect((Compiler as Mock).mock.instances[0].compile.mock.calls.length).toBe(
      1,
    );
  });
});
