import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

test("maps str_replace_editor to 'Writing code'", () => {
  render(<ToolInvocationBadge toolName="str_replace_editor" state="call" />);
  expect(screen.getByText("Writing code...")).toBeDefined();
});

test("maps create_file to 'Creating file'", () => {
  render(<ToolInvocationBadge toolName="create_file" state="call" />);
  expect(screen.getByText("Creating file...")).toBeDefined();
});

test("maps read_file to 'Reading file'", () => {
  render(<ToolInvocationBadge toolName="read_file" state="call" />);
  expect(screen.getByText("Reading file...")).toBeDefined();
});

test("maps delete_file to 'Deleting file'", () => {
  render(<ToolInvocationBadge toolName="delete_file" state="call" />);
  expect(screen.getByText("Deleting file...")).toBeDefined();
});

test("falls back to raw tool name for unknown tools", () => {
  render(<ToolInvocationBadge toolName="some_unknown_tool" state="call" />);
  expect(screen.getByText("some_unknown_tool...")).toBeDefined();
});

test("shows spinner while loading (state !== 'result')", () => {
  const { container } = render(
    <ToolInvocationBadge toolName="str_replace_editor" state="call" />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot when done (state === 'result' with result)", () => {
  const { container } = render(
    <ToolInvocationBadge toolName="str_replace_editor" state="result" result="ok" />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("does not append '...' when done", () => {
  render(
    <ToolInvocationBadge toolName="str_replace_editor" state="result" result="ok" />
  );
  expect(screen.getByText("Writing code")).toBeDefined();
  expect(screen.queryByText("Writing code...")).toBeNull();
});

test("shows spinner when state is 'result' but result is undefined", () => {
  const { container } = render(
    <ToolInvocationBadge toolName="str_replace_editor" state="result" />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
