export function isOrderingOptionDisabled(select: HTMLSelectElement, option: HTMLOptionElement): boolean {
  return select.matches(":disabled") || option.disabled ||
    (option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled);
}
