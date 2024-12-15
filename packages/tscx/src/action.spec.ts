import { describe, expect, it, vi, type Mock } from "vitest";
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
      project: "tsconfig.json",
      noCheck: false,
      watch: false,
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
