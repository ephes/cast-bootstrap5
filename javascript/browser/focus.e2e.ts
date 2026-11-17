import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/browser/focus.html");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
});

for (const checked of [false, true]) {
  test(`contains native Tab in a radio-only group (checked: ${checked})`, async ({ page }) => {
    await page.locator("#modal").evaluate((modal, hasChecked) => {
      modal.innerHTML = `<input id="a" type="radio" name="choice">
        <input id="b" type="radio" name="choice" ${hasChecked ? "checked" : ""}>
        <input id="c" type="radio" name="choice">`;
    }, checked);
    await page.locator(checked ? "#b" : "#a").focus();
    for (const key of ["Tab", "Shift+Tab", "Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      await expect(page.locator(checked ? "#b" : "#a")).toBeFocused();
    }
    // Arrow keys still select a different native group member.
    await page.keyboard.press("ArrowRight");
    const next = page.locator(checked ? "#c" : "#b");
    await expect(next).toBeChecked();
    await expect(next).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(next).toBeFocused();
  });
}

test("keeps separate radio groups in form/name and positive tabindex order", async ({ page }) => {
  await page.locator("#before").evaluate((control) => control.setAttribute("tabindex", "2"));
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = `<form id="one"><input type="radio" name="choice" tabindex="1">
      <input id="first" type="radio" name="choice" checked tabindex="1"></form>
      <form id="two"><input id="second" type="radio" name="choice" checked tabindex="2"></form>
      <input id="third" type="radio" name="choice" checked>
      <input id="fourth" type="radio"><input id="last" type="radio" name="">`;
  });
  await page.locator("#first").focus();
  for (const id of ["second", "third", "fourth", "last", "first"]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  for (const id of ["last", "fourth", "third", "second", "first"]) {
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
});

test("contains an unchecked group with interleaved controls after focus changed within it", async ({ page }) => {
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = `<input id="a" type="radio" name="choice"><button id="middle">Middle</button>
      <input id="b" type="radio" name="choice">`;
  });
  await page.locator("#b").focus();
  for (const id of ["middle", "a", "middle", "a"]) {
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(page.locator("#middle")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#a")).toBeFocused();
});

test("lets the latest trap own native Tab and restores the previous one on close", async ({ page }) => {
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = '<button id="old-first">Old first</button><button id="old-last">Old last</button>';
  });
  await page.locator("#activate-newer").click();
  for (const id of ["new-last", "new-first"]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  for (const id of ["new-last", "new-first"]) {
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  await page.locator("#deactivate-newer").click();
  await page.keyboard.press("Tab");
  await expect(page.locator("#old-first")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#old-last")).toBeFocused();
});

test("resumes the connected trap after the newer container is removed", async ({ page }) => {
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = '<button id="only">Only</button>';
  });
  await page.locator("#activate-newer").click();
  await page.locator("#newer").evaluate((modal) => modal.remove());
  await page.keyboard.press("Tab");
  await expect(page.locator("#only")).toBeFocused();
});

test("wraps through native visible controls including fixed-position controls", async ({ page }) => {
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = `
      <button style="visibility:hidden">Hidden first</button>
      <div inert><button>Inert first</button></div>
      <button id="first">First</button>
      <textarea id="comment"></textarea>
      <button disabled>Disabled</button>
      <fieldset disabled><input></fieldset>
      <input type="hidden"><button tabindex="-2">Negative</button>
      <button id="fixed" style="position:fixed;top:0">Fixed last</button>
      <button style="visibility:hidden">Hidden last</button>
      <div inert><button>Inert last</button></div>
      <div hidden><button>Not rendered</button></div>
      <details><summary tabindex="-1">Collapsed</summary><button>Closed details</button></details>`;
  });
  await page.locator("#first").focus();
  for (const id of ["comment", "fixed", "first"]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  for (const id of ["fixed", "comment", "first", "fixed"]) {
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
});

test("uses positive tabindex order and observes changes at each keypress", async ({ page }) => {
  await page.locator("#before").evaluate((control) => control.setAttribute("tabindex", "2"));
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = `
      <button id="zero">Zero</button>
      <button id="two" tabindex="2">Two</button>
      <button id="one" tabindex="1">One</button>
      <button id="one-again" tabindex="1">One again</button>`;
  });
  await page.locator("#one").focus();
  for (const id of ["one-again", "two", "zero", "one"]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#zero")).toBeFocused();
  await page.locator("#two").evaluate((control) => control.setAttribute("tabindex", "1"));
  await page.keyboard.press("Tab");
  await expect(page.locator("#two")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#zero")).toBeFocused();
});


test("recovers focus across hidden/inert changes and empty facet replacements", async ({ page }) => {
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = '<button id="first">First</button><div id="facet"><button id="last">Last</button></div>';
  });
  await page.locator("#last").focus();
  await page.locator("#facet").evaluate((facet) => facet.setAttribute("inert", ""));
  await page.keyboard.press("Tab");
  await expect(page.locator("#first")).toBeFocused();
  await page.locator("#modal").evaluate((modal) => modal.replaceChildren());
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#modal")).toBeFocused();
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = '<button style="visibility:hidden">Hidden</button><button id="new">New</button><div inert><button>Inert</button></div>';
  });
  await page.keyboard.press("Tab");
  await expect(page.locator("#new")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#new")).toBeFocused();
  await page.locator("#new").evaluate((control) => control.style.visibility = "hidden");
  await page.keyboard.press("Tab");
  await expect(page.locator("#modal")).toBeFocused();
  await expect(page.locator("#modal")).toHaveAttribute("tabindex", "-1");
  await page.locator("#deactivate").click();
  expect(await page.locator("#modal").getAttribute("tabindex")).toBeNull();
});

test("reindexes checked members outside the trap and changing form ownership", async ({ page }) => {
  await page.locator("#before").evaluate((before) => {
    before.insertAdjacentHTML("afterend", `<form id="owner"></form><form id="other-owner"></form>
      <input id="external" type="radio" name='choice[]"' form="owner" checked>`);
  });
  await page.locator("#modal").evaluate((modal) => {
    modal.innerHTML = `<input id="owned" type="radio" name='choice[]"' form="owner">
      <input id="other" type="radio" name='choice[]"' form="other-owner" checked>
      <button id="last">Last</button>`;
  });
  await page.locator("#last").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#other")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#last")).toBeFocused();
  await page.locator("#external").evaluate((radio: HTMLInputElement) => { radio.checked = false; });
  await page.keyboard.press("Tab");
  await expect(page.locator("#owned")).toBeFocused();
  // Moving the external checked member into the other form changes both groups.
  await page.locator("#external").evaluate((radio: HTMLInputElement) => {
    radio.setAttribute("form", "other-owner"); radio.checked = true;
  });
  await page.keyboard.press("Tab");
  await expect(page.locator("#last")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#owned")).toBeFocused();
});

test("indexes the shadow root's focus and checked members independently of the document", async ({ page }) => {
  await page.locator("#activate-shadow").click();
  const host = page.locator("#shadow-host");
  await host.locator("#shadow-last").focus();
  await page.keyboard.press("Tab");
  await expect(host.locator("#shadow-a")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(host.locator("#shadow-b")).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(host.locator("#shadow-last")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(host.locator("#shadow-b")).toBeFocused();
  await host.locator("#shadow-external").evaluate((radio: HTMLInputElement) => { radio.checked = true; });
  // Focused unchecked member still owns its stop for this keypress.
  await page.keyboard.press("Tab");
  await expect(host.locator("#shadow-last")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(host.locator("#shadow-last")).toBeFocused();
});
