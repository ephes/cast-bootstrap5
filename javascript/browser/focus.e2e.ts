import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/browser/focus.html");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
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
