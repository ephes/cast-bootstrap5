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
