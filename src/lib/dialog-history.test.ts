import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDialogHistory, type DialogPopEvent } from "./dialog-history.ts";

function harness(href = "http://localhost/customers") {
  const entries: unknown[] = [
    { __NA: true, tree: "previous" },
    { __NA: true, tree: "page" },
  ];
  let index = 1;
  let location = href;
  const listeners: Array<(event: DialogPopEvent) => void> = [];
  const later: Array<() => void> = [];
  let scroll = { x: 0, y: 40 };

  function dispatch() {
    const event = {
      state: entries[index],
      stopped: false,
      stopImmediatePropagation() {
        this.stopped = false;
        this.stopped = true;
      },
    };
    for (const listener of listeners) listener(event);
    return event;
  }

  const history = createDialogHistory({
    getState: () => entries[index],
    pushState: (data) => {
      entries.splice(index + 1);
      entries.push(data);
      index = entries.length - 1;
    },
    back: () => {
      if (index === 0) return;
      index -= 1;
      dispatch();
    },
    href: () => location,
    scroll: () => scroll,
    scrollTo: (x, y) => {
      scroll = { x, y };
    },
    onPopState: (listener) => {
      listeners.push(listener);
    },
    afterPop: (callback) => {
      later.push(callback);
    },
  });

  async function settle() {
    for (let step = 0; step < 6; step += 1) {
      const queued = later.splice(0, later.length);
      if (queued.length === 0) break;
      for (const callback of queued) callback();
    }
  }

  return {
    history,
    settle,
    dispatch,
    get index() {
      return index;
    },
    get depth() {
      return index - 1;
    },
    get scroll() {
      return scroll;
    },
    setHref(next: string) {
      location = next;
    },
    userBack() {
      if (index === 0) return dispatch();
      index -= 1;
      return dispatch();
    },
    userForward() {
      index += 1;
      return dispatch();
    },
  };
}

describe("dialog history", () => {
  it("pushes one entry when a dialog opens and drops it when the dialog closes", async () => {
    const page = harness();
    let closedByHistory = 0;
    page.history.upsert("vehicle", true, () => {
      closedByHistory += 1;
    });
    await page.settle();
    assert.equal(page.depth, 1);

    page.history.upsert("vehicle", false, () => {
      closedByHistory += 1;
    });
    await page.settle();
    assert.equal(page.depth, 0);
    assert.equal(closedByHistory, 0);
  });

  it("closes the top dialog on back and stays on the page", async () => {
    const page = harness();
    const closed: string[] = [];
    page.history.upsert("member", true, () => {
      closed.push("member");
      page.history.upsert("member", false, () => undefined);
    });
    await page.settle();

    const event = page.userBack();
    await page.settle();
    assert.equal(event.stopped, true);
    assert.deepEqual(closed, ["member"]);
    assert.equal(page.depth, 0);
  });

  it("closes only the top dialog when two are open", async () => {
    const page = harness();
    const closed: string[] = [];
    page.history.upsert("member", true, () => {
      closed.push("member");
      page.history.upsert("member", false, () => undefined);
    });
    await page.settle();
    page.history.upsert("confirm", true, () => {
      closed.push("confirm");
      page.history.upsert("confirm", false, () => undefined);
    });
    await page.settle();
    assert.equal(page.depth, 2);

    const first = page.userBack();
    await page.settle();
    assert.equal(first.stopped, true);
    assert.deepEqual(closed, ["confirm"]);
    assert.equal(page.depth, 1);

    const second = page.userBack();
    await page.settle();
    assert.equal(second.stopped, true);
    assert.deepEqual(closed, ["confirm", "member"]);
    assert.equal(page.depth, 0);
  });

  it("does not navigate again when close and popstate both run", async () => {
    const page = harness();
    let historyCloses = 0;
    page.history.upsert("call", true, () => {
      historyCloses += 1;
    });
    await page.settle();
    page.history.upsert("call", false, () => {
      historyCloses += 1;
    });
    await page.settle();
    assert.equal(page.depth, 0);
    assert.equal(historyCloses, 0);
  });

  it("does not reopen a dialog on forward", async () => {
    const page = harness();
    let historyCloses = 0;
    page.history.upsert("invite", true, () => {
      historyCloses += 1;
      page.history.upsert("invite", false, () => undefined);
    });
    await page.settle();
    page.userBack();
    await page.settle();
    assert.equal(historyCloses, 1);

    const forward = page.userForward();
    await page.settle();
    assert.equal(forward.stopped, true);
    assert.equal(historyCloses, 1);
    assert.equal(page.depth, 0);
  });

  it("keeps one entry when a confirm replaces a sheet, then closes only the confirm", async () => {
    const page = harness();
    const closed: string[] = [];
    page.history.upsert("member", true, () => {
      closed.push("member");
      page.history.upsert("member", false, () => undefined);
    });
    page.history.upsert("confirm", false, () => undefined);
    await page.settle();
    assert.equal(page.depth, 1);

    page.history.upsert("member", false, () => undefined);
    page.history.upsert("confirm", true, () => {
      closed.push("confirm");
      page.history.upsert("confirm", false, () => undefined);
      page.history.upsert("member", true, () => {
        closed.push("member");
        page.history.upsert("member", false, () => undefined);
      });
    });
    await page.settle();
    assert.equal(page.depth, 1);

    page.userBack();
    await page.settle();
    assert.deepEqual(closed, ["confirm"]);
    assert.equal(page.depth, 1);

    page.userBack();
    await page.settle();
    assert.deepEqual(closed, ["confirm", "member"]);
    assert.equal(page.depth, 0);
  });

  it("lets back leave the route when no dialog is open", async () => {
    const page = harness();
    page.history.upsert("vehicle", false, () => undefined);
    await page.settle();
    const event = page.userBack();
    assert.equal(event.stopped, false);
    assert.equal(page.index, 0);
  });
});
