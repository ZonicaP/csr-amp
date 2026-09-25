import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPermission, permissions, permissionsForRoles } from "./permissions.ts";

describe("CSR permissions", () => {
  it("gives an agent customer access and withholds account changes", () => {
    assert.equal(hasPermission(["AGENT"], "customers:read"), true);
    assert.equal(hasPermission(["AGENT"], "customers:update"), true);
    assert.equal(hasPermission(["AGENT"], "subscriptions:cancel"), false);
    assert.equal(hasPermission(["AGENT"], "csr:read"), false);
    assert.equal(hasPermission(["AGENT"], "csr:manage"), false);
  });

  it("lets a supervisor resolve wash-blocking account issues", () => {
    assert.equal(hasPermission(["SUPERVISOR"], "subscriptions:transfer"), true);
    assert.equal(hasPermission(["SUPERVISOR"], "subscriptions:cancel"), true);
    assert.equal(hasPermission(["SUPERVISOR"], "billing:resolve-overdue"), true);
    assert.equal(hasPermission(["SUPERVISOR"], "csr:read"), true);
    assert.equal(hasPermission(["SUPERVISOR"], "csr:manage"), false);
  });

  it("gives an admin every permission", () => {
    for (const permission of permissions) {
      assert.equal(hasPermission(["ADMIN"], permission), true);
    }
  });

  it("combines permissions when a CSR has more than one role", () => {
    const granted = permissionsForRoles(["AGENT", "SUPERVISOR"]);
    assert.equal(granted.has("customers:update"), true);
    assert.equal(granted.has("billing:resolve-overdue"), true);
    assert.equal(granted.has("csr:manage"), false);
  });
});
