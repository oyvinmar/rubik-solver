import { expect, it } from "vitest";
import { FACE_VIEWS } from "./faceViews";

it("covers every face once", () => {
  expect(FACE_VIEWS.map((v) => v.face).sort()).toEqual(["B", "D", "F", "L", "R", "U"]);
});

it("matches how the cube is held for each face", () => {
  const holds = Object.fromEntries(FACE_VIEWS.map((v) => [v.face, v.hold]));
  expect(holds.F).toEqual({ top: "white", front: "green", right: "red" });
  expect(holds.R).toEqual({ top: "white", front: "red", right: "blue" });
  expect(holds.B).toEqual({ top: "white", front: "blue", right: "orange" });
  expect(holds.L).toEqual({ top: "white", front: "orange", right: "green" });
  // Tipping the top towards you brings blue to the top; the bottom towards you brings green up.
  expect(holds.U).toEqual({ top: "blue", front: "white", right: "red" });
  expect(holds.D).toEqual({ top: "green", front: "yellow", right: "red" });
});

it("knows which colour borders each side of the grid", () => {
  const u = FACE_VIEWS.find((v) => v.face === "U")!;
  expect(u.edges).toEqual({ top: "blue", right: "red", bottom: "green", left: "orange" });
});
