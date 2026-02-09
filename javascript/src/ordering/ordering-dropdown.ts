const CONTAINER_SELECTOR = "#div_id_o";

function findOrderingContainers(root: ParentNode | Element): HTMLElement[] {
  const containers: HTMLElement[] = [];

  if (root instanceof Element && root.matches(CONTAINER_SELECTOR)) {
    containers.push(root as HTMLElement);
  }

  containers.push(...Array.from(root.querySelectorAll<HTMLElement>(CONTAINER_SELECTOR)));
  return containers;
}

export function enhanceOrderingDropdown(container: HTMLElement): void {
  if (container.dataset.castOrderingEnhanced === "true") {
    return;
  }

  if (container.closest(".cast-search-modal")) {
    return;
  }

  const select = container.querySelector<HTMLSelectElement>('select[name="o"]');
  if (!select) {
    return;
  }

  const label = container.querySelector<HTMLLabelElement>('label[for="id_o"]');
  if (label && !label.id) {
    label.id = "ordering-label";
  }

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-secondary dropdown-toggle w-100 text-start";
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  if (label?.id) {
    button.setAttribute("aria-labelledby", label.id);
  }

  const menu = document.createElement("ul");
  menu.className = "dropdown-menu w-100";

  const options = Array.from(select.options);
  options.forEach((option) => {
    const item = document.createElement("li");
    const itemButton = document.createElement("button");
    itemButton.type = "button";
    itemButton.className = "dropdown-item";
    itemButton.textContent = option.textContent;
    itemButton.setAttribute("data-order-value", option.value);

    if (option.selected) {
      itemButton.classList.add("active");
      button.textContent = option.textContent;
    }

    item.appendChild(itemButton);
    menu.appendChild(item);
  });

  if (!button.textContent) {
    button.textContent = options.length > 0 ? options[0].textContent : "Ordering";
  }

  dropdown.appendChild(button);
  dropdown.appendChild(menu);
  select.parentNode?.insertBefore(dropdown, select);

  menu.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const buttonTarget = target.closest<HTMLElement>("[data-order-value]");
    if (!buttonTarget) {
      return;
    }

    const value = buttonTarget.getAttribute("data-order-value") ?? "";
    select.value = value;
    button.textContent = buttonTarget.textContent;

    menu.querySelectorAll<HTMLElement>(".dropdown-item").forEach((itemButton) => {
      itemButton.classList.toggle("active", itemButton === buttonTarget);
    });
  });

  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-hidden", "true");
  select.style.display = "none";
  container.dataset.castOrderingEnhanced = "true";
}

export function initOrderingDropdowns(root: ParentNode | Element = document): void {
  findOrderingContainers(root).forEach((container) => {
    enhanceOrderingDropdown(container);
  });
}
