import { isOrderingOptionDisabled } from "@/utils/ordering-options";
import { createFocusTrap, type FocusTrapController } from "@/utils/focus-trap";
import CastSearchTypeahead from "@/search/cast-search-typeahead";

const DEFAULT_TRIGGER_SELECTOR = "[data-cast-search-trigger]";
const ORDERING_DEFAULT = "-visible_date";
export const FACET_DEBOUNCE_MS = 300;
const FACET_CACHE_MAX_ENTRIES = 50;
const FACET_REQUEST_DEADLINE_MS = 5000;
const FACET_GROUP_NAMES = ["date_facets", "tag_facets", "category_facets"] as const;
const ALL_FACETS_LABEL = "All";

type FacetGroupName = (typeof FACET_GROUP_NAMES)[number];

type FacetState = Record<FacetGroupName, string>;

type ModalFacetOption = {
  slug: string;
  name: string;
  count: number;
};

type ModalFacetGroup = {
  selected: string;
  all_count: number;
  options: ModalFacetOption[];
};

type ModalFacetResponse = {
  mode: "modal";
  result_count: number;
  groups: Partial<Record<FacetGroupName, ModalFacetGroup>>;
};

type ModalState = {
  selected: FacetState;
  search: string;
  ordering: string;
  inFlight: AbortController | null;
  requestSeq: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  loadingTimer: ReturnType<typeof setTimeout> | null;
  cache: Map<string, ModalFacetResponse>;
};

function findOrderingContainers(root: ParentNode | Element): HTMLElement[] {
  const containers: HTMLElement[] = [];
  if (root instanceof Element && root.id === "div_id_o") {
    containers.push(root as HTMLElement);
  }
  containers.push(...Array.from(root.querySelectorAll<HTMLElement>("#div_id_o")));
  return containers;
}

function isFacetGroupName(value: string | null): value is FacetGroupName {
  return value !== null && FACET_GROUP_NAMES.includes(value as FacetGroupName);
}

function getFacetPanelName(group: HTMLElement): string | null {
  const panel = group.closest<HTMLElement>("[data-cast-filter-panel]");
  const name = panel?.getAttribute("data-cast-filter-panel");
  if (!name || name === "o") {
    return null;
  }
  return name;
}

function getFacetGroupName(group: HTMLElement): FacetGroupName | null {
  const fromAttribute = group.getAttribute("data-cast-facet-group");
  if (isFacetGroupName(fromAttribute)) {
    return fromAttribute;
  }

  const fromPanel = getFacetPanelName(group);
  if (isFacetGroupName(fromPanel)) {
    return fromPanel;
  }

  return null;
}

function findFacetGroupElement(modal: HTMLElement, groupName: FacetGroupName): HTMLElement | null {
  const byAttribute = modal.querySelector<HTMLElement>(`[data-cast-facet-group="${groupName}"]`);
  if (byAttribute) {
    return byAttribute;
  }

  const panel = modal.querySelector<HTMLElement>(`[data-cast-filter-panel="${groupName}"]`);
  return panel?.querySelector<HTMLElement>("[data-cast-facet-group]") ?? null;
}

export function buildOrderingPills(root: ParentNode | Element): void {
  findOrderingContainers(root).forEach((orderContainer) => {
    if (orderContainer.dataset.castOrderingPills === "true") return;
    const select = orderContainer.querySelector<HTMLSelectElement>('select[name="o"]');
    if (!select || select.matches(":disabled")) return;

    const options = Array.from(select.options).filter((option) => option.value !== "");
    if (options.length === 0) return;
    const defaultOption = options.find((option) => option.value === ORDERING_DEFAULT);
    if (select.value === "" && defaultOption && !isOrderingOptionDisabled(select, defaultOption)) {
      select.value = defaultOption.value;
    }

    const pillsDiv = document.createElement("div");
    pillsDiv.className = "cast-ordering-pills";
    const pills: HTMLButtonElement[] = [];
    const sync = (): void => {
      pills.forEach((pill, index) => {
        pill.disabled = isOrderingOptionDisabled(select, options[index]);
        pill.classList.toggle("active", options[index].selected);
        pill.setAttribute("aria-pressed", String(options[index].selected));
      });
    };

    options.forEach((option) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "tag-pill";
      pill.textContent = option.textContent;
      pill.setAttribute("data-order-value", option.value);
      pills.push(pill);
      pill.addEventListener("click", () => {
        const index = Array.from(select.options).indexOf(option);
        if (index < 0 || isOrderingOptionDisabled(select, option) || select.selectedIndex === index) return;
        select.selectedIndex = index;
        sync();
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      pillsDiv.appendChild(pill);
    });

    select.addEventListener("input", sync);
    select.addEventListener("change", sync);
    const form = select.form;
    const onReset = (): void => {
      if (!select.isConnected) {
        form?.removeEventListener("reset", onReset);
        return;
      }
      // Native reset restores the selection after dispatching the event.
      setTimeout(sync, 0);
    };
    form?.addEventListener("reset", onReset);
    sync();
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    select.style.display = "none";
    orderContainer.appendChild(pillsDiv);
    orderContainer.dataset.castOrderingPills = "true";
  });
}

export function initModalFacetToggles(modal: HTMLElement): void {
  modal.querySelectorAll<HTMLElement>("[data-cast-facet-group]").forEach((group) => {
    if (group.dataset.castFacetToggleReady === "true") {
      return;
    }

    const limit = Number.parseInt(group.dataset.limit ?? "12", 10);
    const items = Array.from(group.querySelectorAll<HTMLElement>(".cast-date-facet-item, .tag-pill"));

    if (!Number.isFinite(limit) || items.length <= limit) {
      group.dataset.castFacetToggleReady = "true";
      return;
    }

    const toggle = group.parentElement?.querySelector<HTMLElement>("[data-cast-facet-toggle]");
    if (!toggle) {
      group.dataset.castFacetToggleReady = "true";
      return;
    }

    const applyExpandedState = (expanded: boolean): void => {
      items.forEach((item, index) => {
        const selected = item.matches(".selected") || item.querySelector("a.selected") !== null;
        item.hidden = !expanded && index >= limit && !selected;
      });
      toggle.setAttribute("aria-expanded", String(expanded));

      const showText = toggle.querySelector<HTMLElement>("[data-show-text]");
      const hideText = toggle.querySelector<HTMLElement>("[data-hide-text]");
      if (showText) {
        showText.hidden = expanded;
      }
      if (hideText) {
        hideText.hidden = !expanded;
      }
    };

    applyExpandedState(false);
    toggle.hidden = !items.some((item) => item.hidden);

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      applyExpandedState(!expanded);
    });

    group.dataset.castFacetToggleReady = "true";
  });
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function getFacetValueFromLink(link: HTMLAnchorElement, paramName: string): string {
  const href = link.getAttribute("href");
  if (!href) {
    return "";
  }

  try {
    const url = new URL(href, window.location.href);
    return url.searchParams.get(paramName) ?? "";
  } catch {
    return "";
  }
}

function findManagedHiddenInputs(form: HTMLFormElement, paramName: string): HTMLInputElement[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).filter(
    (input) => input.name === paramName
  );
}

export function syncFacetHiddenInput(form: HTMLFormElement, paramName: string, value: string): void {
  findManagedHiddenInputs(form, paramName).forEach((input) => input.remove());

  if (!value) {
    return;
  }

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = paramName;
  input.value = value;
  input.setAttribute("data-cast-facet-hidden", "true");
  form.appendChild(input);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFacetCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseModalFacetResponse(payload: unknown): ModalFacetResponse | null {
  if (!isRecord(payload) || payload.mode !== "modal" || !isFacetCount(payload.result_count) || !isRecord(payload.groups)) {
    return null;
  }

  const groups: ModalFacetResponse["groups"] = {};
  for (const [name, group] of Object.entries(payload.groups)) {
    if (!isFacetGroupName(name) || !isRecord(group) || typeof group.selected !== "string" ||
        !isFacetCount(group.all_count) || !Array.isArray(group.options)) {
      return null;
    }
    const options: ModalFacetOption[] = [];
    for (const option of group.options) {
      if (!isRecord(option) || typeof option.slug !== "string" || typeof option.name !== "string" || !isFacetCount(option.count)) {
        return null;
      }
      options.push({ slug: option.slug, name: option.name, count: option.count });
    }
    groups[name] = { selected: group.selected, all_count: group.all_count, options };
  }
  return { mode: "modal", result_count: payload.result_count, groups };
}

function createEmptyFacetState(): FacetState {
  return {
    date_facets: "",
    tag_facets: "",
    category_facets: "",
  };
}

function dedupeFacetOptions(options: ModalFacetOption[]): ModalFacetOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.slug)) {
      return false;
    }
    seen.add(option.slug);
    return true;
  });
}

export default class CastSearchModal extends HTMLElement {
  private trigger: HTMLElement | null;
  private overlay: HTMLElement | null;
  private modal: HTMLElement | null;
  private modalBody: HTMLElement | null;
  private closeButton: HTMLElement | null;
  private searchInput: HTMLInputElement | null;
  private form: HTMLFormElement | null;
  private loadingElement: HTMLElement | null;
  private statusElement: HTMLElement | null;
  private noResultsElement: HTMLElement | null;
  private dynamicFacetsUrl: string | null;
  private typeahead: CastSearchTypeahead | null;
  private suggestionsOpen: boolean;
  private latestResultCount: number | null;
  private focusTrap: FocusTrapController | null;
  private listenersBound: boolean;
  private refreshFacetsOnOpen = false;
  private readonly state: ModalState;
  private boundTriggerClick: () => void;
  private boundOverlayClick: (event: Event) => void;
  private boundCloseClick: () => void;
  private boundDocumentKeydown: (event: KeyboardEvent) => void;
  private boundModalClick: (event: Event) => void;
  private boundSearchInput: () => void;

  constructor() {
    super();
    this.trigger = null;
    this.overlay = null;
    this.modal = null;
    this.modalBody = null;
    this.closeButton = null;
    this.searchInput = null;
    this.form = null;
    this.loadingElement = null;
    this.statusElement = null;
    this.noResultsElement = null;
    this.dynamicFacetsUrl = null;
    this.typeahead = null;
    this.suggestionsOpen = false;
    this.latestResultCount = null;
    this.focusTrap = null;
    this.listenersBound = false;
    this.state = {
      selected: createEmptyFacetState(),
      search: "",
      ordering: "",
      inFlight: null,
      requestSeq: 0,
      debounceTimer: null,
      loadingTimer: null,
      cache: new Map<string, ModalFacetResponse>(),
    };

    this.boundTriggerClick = this.openModal.bind(this);
    this.boundOverlayClick = this.handleOverlayClick.bind(this);
    this.boundCloseClick = this.closeModal.bind(this);
    this.boundDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.boundModalClick = this.handleModalClick.bind(this);
    this.boundSearchInput = this.handleSearchInput.bind(this);
  }

  static register(tagName = "cast-search-modal"): void {
    if (!("customElements" in window)) {
      return;
    }

    if (!customElements.get(tagName)) {
      customElements.define(tagName, CastSearchModal);
    }
  }

  connectedCallback(): void {
    this.resolveElements();
    if (!this.overlay || !this.modal) {
      return;
    }

    this.focusTrap = createFocusTrap(this.modal);
    initModalFacetToggles(this.modal);
    buildOrderingPills(this.modal);
    this.initializeFacetInputsFromSelection();
    this.captureStateFromForm();
    this.markAllFacetLinks();
    this.expandActivePanels();
    this.bindListeners();
    this.typeahead?.connect();
  }

  disconnectedCallback(): void {
    if (this.overlay && !this.overlay.hidden) {
      this.overlay.hidden = true;
      document.body.style.overflow = "";
    }
    this.clearDebounceTimer();
    this.clearLoadingTimer();
    this.state.requestSeq += 1;
    this.abortInFlightRequest();
    this.typeahead?.disconnect();
    this.setLoading(false);
    this.unbindListeners();
    this.focusTrap?.deactivate();
    this.focusTrap = null;
  }

  openModal(): void {
    if (!this.overlay || !this.overlay.hidden) {
      return;
    }

    this.overlay.hidden = false;
    document.body.style.overflow = "hidden";
    this.typeahead?.connect();
    this.typeahead?.resume();
    this.focusTrap?.activate();
    this.searchInput?.focus();
    this.typeahead?.facetStateChanged();
    if (this.refreshFacetsOnOpen) {
      this.refreshFacetsOnOpen = false;
      this.scheduleFacetRecalculation();
    }
  }

  closeModal(): void {
    if (!this.overlay) {
      return;
    }

    this.refreshFacetsOnOpen ||= this.state.debounceTimer !== null || this.state.inFlight !== null;
    this.clearDebounceTimer();
    this.state.requestSeq += 1;
    this.abortInFlightRequest();
    this.typeahead?.disconnect();
    this.overlay.hidden = true;
    document.body.style.overflow = "";
    this.focusTrap?.deactivate();
    this.trigger?.focus();
  }

  private resolveElements(): void {
    const triggerSelector = this.getAttribute("data-trigger") ?? DEFAULT_TRIGGER_SELECTOR;
    this.trigger = document.querySelector<HTMLElement>(triggerSelector);
    this.overlay = this.querySelector<HTMLElement>("[data-cast-search-overlay]");
    this.modal = this.overlay?.querySelector<HTMLElement>(".cast-search-modal") ?? null;
    this.modalBody = this.overlay?.querySelector<HTMLElement>(".cast-search-modal-body") ?? null;
    this.closeButton = this.overlay?.querySelector<HTMLElement>("[data-cast-search-close]") ?? null;
    this.searchInput = this.overlay?.querySelector<HTMLInputElement>('input[name="search"]') ?? null;
    this.form =
      this.overlay?.querySelector<HTMLFormElement>("form[data-cast-search-form]") ??
      this.overlay?.querySelector<HTMLFormElement>("form") ??
      null;
    this.loadingElement = this.overlay?.querySelector<HTMLElement>("[data-cast-facet-loading]") ?? null;
    this.statusElement = this.overlay?.querySelector<HTMLElement>("[data-cast-facet-status]") ?? null;
    this.noResultsElement = this.overlay?.querySelector<HTMLElement>("[data-cast-no-results]") ?? null;
    this.dynamicFacetsUrl = this.getAttribute("data-cast-dynamic-facets-url");
    const suggestionsUrl = this.getAttribute("data-cast-search-suggestions-url");
    const suggestionsList = this.overlay?.querySelector<HTMLElement>("[data-cast-search-suggestions]") ?? null;
    const suggestionsStatus = this.overlay?.querySelector<HTMLElement>("[data-cast-suggestion-status]") ?? null;
    const suggestionsLoading = this.overlay?.querySelector<HTMLElement>("[data-cast-suggestion-loading]") ?? null;
    this.typeahead?.disconnect();
    this.typeahead = null;
    if (suggestionsUrl && this.searchInput && this.form && suggestionsList && suggestionsStatus) {
      this.typeahead = new CastSearchTypeahead(
        suggestionsUrl,
        {
          input: this.searchInput,
          form: this.form,
          listbox: suggestionsList,
          status: suggestionsStatus,
          loading: suggestionsLoading,
        },
        {
          onOpenChange: (open) => this.handleSuggestionsOpenChange(open),
          messages: {
            noSuggestions: this.getAttribute("data-cast-suggestion-none") ?? undefined,
            unavailable: this.getAttribute("data-cast-suggestion-unavailable") ?? undefined,
            oneAvailable: this.getAttribute("data-cast-suggestion-one") ?? undefined,
            manyAvailable: this.getAttribute("data-cast-suggestion-many") ?? undefined,
          },
        }
      );
      if (this.isConnected) {
        this.typeahead.connect();
      }
    }
  }

  private bindListeners(): void {
    if (this.listenersBound) {
      return;
    }

    this.trigger?.addEventListener("click", this.boundTriggerClick);
    this.overlay?.addEventListener("click", this.boundOverlayClick);
    this.closeButton?.addEventListener("click", this.boundCloseClick);
    this.modal?.addEventListener("click", this.boundModalClick);
    this.searchInput?.addEventListener("input", this.boundSearchInput);
    this.searchInput?.addEventListener("search", this.boundSearchInput);
    document.addEventListener("keydown", this.boundDocumentKeydown);

    this.listenersBound = true;
  }

  private unbindListeners(): void {
    if (!this.listenersBound) {
      return;
    }

    this.trigger?.removeEventListener("click", this.boundTriggerClick);
    this.overlay?.removeEventListener("click", this.boundOverlayClick);
    this.closeButton?.removeEventListener("click", this.boundCloseClick);
    this.modal?.removeEventListener("click", this.boundModalClick);
    this.searchInput?.removeEventListener("input", this.boundSearchInput);
    this.searchInput?.removeEventListener("search", this.boundSearchInput);
    document.removeEventListener("keydown", this.boundDocumentKeydown);

    this.listenersBound = false;
  }

  private handleOverlayClick(event: Event): void {
    if (event.target === this.overlay) {
      this.closeModal();
    }
  }

  private handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    if (!this.overlay) {
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      if (isTypingTarget(document.activeElement)) {
        return;
      }

      event.preventDefault();
      if (this.overlay.hidden) {
        this.openModal();
      } else {
        this.closeModal();
      }
      return;
    }

    if (event.key === "Escape" && !this.overlay.hidden) {
      event.preventDefault();
      this.closeModal();
    }
  }

  private handleSearchInput(): void {
    this.state.search = this.searchInput?.value ?? "";
    this.state.ordering = this.getOrderingValue();
    this.scheduleFacetRecalculation();
  }

  private handleModalClick(event: Event): void {
    if (!this.modal || !this.form) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const clearLink = target.closest<HTMLAnchorElement>(".cast-btn-clear");
    if (clearLink && this.modal.contains(clearLink)) {
      event.preventDefault();
      this.clearAllFilters();
      return;
    }

    const link = target.closest<HTMLAnchorElement>("[data-cast-facet-group] a[href]");
    if (!link || !this.modal.contains(link)) {
      return;
    }

    if (link.getAttribute("aria-disabled") === "true" || link.classList.contains("is-disabled")) {
      event.preventDefault();
      return;
    }

    const group = link.closest<HTMLElement>("[data-cast-facet-group]");
    if (!group) {
      return;
    }

    const groupName = getFacetGroupName(group);
    if (!groupName) {
      return;
    }

    event.preventDefault();

    group.querySelectorAll("a.selected").forEach((selectedLink) => {
      selectedLink.classList.remove("selected");
    });
    link.classList.add("selected");

    const value = getFacetValueFromLink(link, groupName);
    this.state.selected[groupName] = value;
    syncFacetHiddenInput(this.form, groupName, value);

    const panel = group.closest("details");
    if (panel) {
      panel.open = true;
    }

    this.state.search = this.searchInput?.value ?? "";
    this.state.ordering = this.getOrderingValue();

    this.scheduleFacetRecalculation();
    this.typeahead?.facetStateChanged();
  }

  private clearAllFilters(): void {
    if (!this.modal || !this.form) {
      return;
    }

    if (this.searchInput) {
      this.searchInput.value = "";
    }
    this.state.search = "";

    FACET_GROUP_NAMES.forEach((groupName) => {
      this.state.selected[groupName] = "";
      syncFacetHiddenInput(this.form as HTMLFormElement, groupName, "");

      const group = findFacetGroupElement(this.modal as HTMLElement, groupName);
      if (!group) {
        return;
      }

      const links = Array.from(group.querySelectorAll<HTMLAnchorElement>("a[href]"));
      links.forEach((link) => link.classList.remove("selected"));
      const allLink = links.find((link) => getFacetValueFromLink(link, groupName) === "");
      allLink?.classList.add("selected");
    });

    const orderingSelect = this.form.querySelector<HTMLSelectElement>('select[name="o"]');
    if (orderingSelect) {
      const available = Array.from(orderingSelect.options).filter(
        (option) => !isOrderingOptionDisabled(orderingSelect, option)
      );
      const resetOption = available.find((option) => option.value === ORDERING_DEFAULT) ?? available[0];
      if (resetOption && orderingSelect.selectedIndex !== resetOption.index) {
        orderingSelect.selectedIndex = resetOption.index;
        orderingSelect.dispatchEvent(new Event("input", { bubbles: true }));
        orderingSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      this.state.ordering = orderingSelect.value;
    } else {
      this.state.ordering = "";
    }

    this.applyNoResultsState(1);
    this.markAllFacetLinks();
    this.expandActivePanels();
    this.announceStatus("Filters cleared.");
    this.scheduleFacetRecalculation();
    this.typeahead?.facetStateChanged();
  }

  private initializeFacetInputsFromSelection(): void {
    if (!this.modal || !this.form) {
      return;
    }

    const form = this.form;
    this.modal.querySelectorAll<HTMLElement>("[data-cast-facet-group]").forEach((group) => {
      const groupName = getFacetGroupName(group);
      if (!groupName) {
        return;
      }

      const selectedLink = group.querySelector<HTMLAnchorElement>("a.selected[href]");
      if (!selectedLink) {
        this.state.selected[groupName] = "";
        syncFacetHiddenInput(form, groupName, "");
        return;
      }

      const value = getFacetValueFromLink(selectedLink, groupName);
      this.state.selected[groupName] = value;
      syncFacetHiddenInput(form, groupName, value);
    });
  }

  private captureStateFromForm(): void {
    this.state.search = this.searchInput?.value ?? "";
    this.state.ordering = this.getOrderingValue();
  }

  private scheduleFacetRecalculation(): void {
    if (!this.dynamicFacetsUrl) {
      return;
    }

    this.clearDebounceTimer();
    this.abortInFlightRequest();
    const sequence = ++this.state.requestSeq;
    const requestKey = this.buildRequestKey();
    this.state.debounceTimer = setTimeout(() => {
      this.state.debounceTimer = null;
      void this.refreshDynamicFacets(sequence, requestKey);
    }, FACET_DEBOUNCE_MS);
  }

  private clearDebounceTimer(): void {
    if (this.state.debounceTimer === null) {
      return;
    }
    clearTimeout(this.state.debounceTimer);
    this.state.debounceTimer = null;
  }

  private clearLoadingTimer(): void {
    if (this.state.loadingTimer === null) {
      return;
    }
    clearTimeout(this.state.loadingTimer);
    this.state.loadingTimer = null;
  }

  private abortInFlightRequest(): void {
    this.state.inFlight?.abort();
    this.state.inFlight = null;
    this.setLoading(false);
  }

  private async refreshDynamicFacets(sequence: number, requestKey: string): Promise<void> {
    if (!this.dynamicFacetsUrl) {
      return;
    }

    if (sequence !== this.state.requestSeq || requestKey !== this.buildRequestKey()) {
      return;
    }

    const cached = this.state.cache.get(requestKey);
    if (cached) {
      this.setLoading(false);
      this.applyFacetResponse(cached);
      this.announceStatus("Filters updated.");
      return;
    }

    const controller = new AbortController();
    this.state.inFlight = controller;

    this.setLoading(true);

    let timedOut = false;
    let rejectAborted: (reason: DOMException) => void = () => undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      rejectAborted = reject;
    });
    const onAbort = () => rejectAborted(new DOMException("Aborted", "AbortError"));
    controller.signal.addEventListener("abort", onAbort, { once: true });
    const deadlineTimer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FACET_REQUEST_DEADLINE_MS);

    try {
      // Bound fetch and body parsing even if either ignores the abort signal.
      const payload: unknown = await Promise.race([
        (async () => {
          const response = await fetch(this.buildRequestUrl().toString(), { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })(),
        aborted,
      ]);
      const normalized = parseModalFacetResponse(payload);
      if (!normalized) {
        throw new Error("Invalid modal facet response");
      }

      if (sequence !== this.state.requestSeq || requestKey !== this.buildRequestKey()) {
        return;
      }

      this.setCacheEntry(requestKey, normalized);
      this.applyFacetResponse(normalized);
      this.announceStatus("Filters updated.");
    } catch (error) {
      if (!timedOut && error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (sequence !== this.state.requestSeq || requestKey !== this.buildRequestKey()) {
        return;
      }
      this.latestResultCount = null;
      this.updateNoResultsVisibility();
      this.announceStatus("Could not refresh filters. You can still search.");
    } finally {
      controller.signal.removeEventListener("abort", onAbort);
      clearTimeout(deadlineTimer);
      if (this.state.inFlight === controller) {
        this.state.inFlight = null;
        this.setLoading(false);
      }
    }
  }

  private buildRequestUrl(): URL {
    const url = new URL(this.dynamicFacetsUrl ?? "", window.location.href);
    const params = this.buildRequestParams(true);
    url.search = params.toString();
    return url;
  }

  private buildRequestKey(): string {
    return this.buildRequestParams(false).toString();
  }

  private buildRequestParams(includeOrdering: boolean): URLSearchParams {
    const params = new URLSearchParams();
    params.set("mode", "modal");

    if (this.state.search) {
      params.set("search", this.state.search);
    }

    FACET_GROUP_NAMES.forEach((groupName) => {
      const value = this.state.selected[groupName];
      if (value) {
        params.set(groupName, value);
      }
    });

    if (includeOrdering && this.state.ordering) {
      params.set("o", this.state.ordering);
    }

    return params;
  }

  private setCacheEntry(key: string, value: ModalFacetResponse): void {
    this.state.cache.delete(key);
    this.state.cache.set(key, value);
    if (this.state.cache.size <= FACET_CACHE_MAX_ENTRIES) {
      return;
    }
    const oldestKey = this.state.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.state.cache.delete(oldestKey);
    }
  }

  private getOrderingValue(): string {
    if (!this.form) {
      return "";
    }
    const select = this.form.querySelector<HTMLSelectElement>('select[name="o"]');
    if (!select) {
      return "";
    }
    return select.value;
  }

  private applyFacetResponse(payload: ModalFacetResponse): void {
    if (!this.modal || !this.form) {
      return;
    }

    Object.entries(payload.groups).forEach(([groupName, groupData]) => {
      if (!isFacetGroupName(groupName) || !groupData) {
        return;
      }

      this.state.selected[groupName] = groupData.selected;
    });
    // Every rendered URL must use the same complete set of new selections.
    Object.entries(payload.groups).forEach(([groupName, groupData]) => {
      if (isFacetGroupName(groupName) && groupData) {
        this.renderFacetGroup(groupName, groupData);
      }
    });

    this.syncHiddenInputsFromState();
    this.markAllFacetLinks();
    initModalFacetToggles(this.modal);
    this.expandActivePanels();
    this.applyNoResultsState(payload.result_count);
  }

  private renderFacetGroup(groupName: FacetGroupName, groupData: ModalFacetGroup): void {
    if (!this.modal || !this.form) {
      return;
    }

    const group = findFacetGroupElement(this.modal, groupName);
    if (!group) {
      return;
    }

    const panel = group.closest("details");
    const panelWasOpen = panel?.open ?? false;
    const allLabel = this.getAllLabel(group, groupName);
    const existingOptionsContainer = group.querySelector<HTMLElement>(".cast-date-facet-container");
    const optionsContainerClassName = existingOptionsContainer?.className ?? "cast-date-facet-container";

    const fragment = document.createDocumentFragment();
    const allItem = this.createFacetOptionItem({
      groupName,
      slug: "",
      name: allLabel,
      count: groupData.all_count,
      selected: groupData.selected === "",
    });
    if (allItem) {
      fragment.appendChild(allItem);
    }

    const normalizedOptions = this.orderOptionsByCurrentDom(groupName, group, dedupeFacetOptions(groupData.options));
    normalizedOptions.forEach((option) => {
      const optionItem = this.createFacetOptionItem({
        groupName,
        slug: option.slug,
        name: option.name,
        count: option.count,
        selected: option.slug === groupData.selected,
      });
      if (optionItem) {
        fragment.appendChild(optionItem);
      }
    });

    const optionsContainer = document.createElement("div");
    optionsContainer.className = optionsContainerClassName;
    optionsContainer.appendChild(fragment);
    group.replaceChildren(optionsContainer);
    this.resetFacetToggleForGroup(group);

    if (panel) {
      panel.open = panelWasOpen;
    }
  }

  private createFacetOptionItem({
    groupName,
    slug,
    name,
    count,
    selected,
  }: {
    groupName: FacetGroupName;
    slug: string;
    name: string;
    count: number;
    selected: boolean;
  }): HTMLElement | null {
    if (slug !== "" && count === 0 && !selected) {
      return null;
    }

    const item = document.createElement("div");
    item.className = "cast-date-facet-item";

    const link = document.createElement("a");
    link.href = this.buildFacetHref(groupName, slug);
    link.textContent = `${name} (${count})`;
    if (slug === "") {
      link.classList.add("cast-facet-all-option");
    }

    if (selected) {
      link.classList.add("selected");
    }

    item.appendChild(link);
    return item;
  }

  private markAllFacetLinks(): void {
    if (!this.modal) {
      return;
    }

    this.modal.querySelectorAll<HTMLElement>("[data-cast-facet-group]").forEach((group) => {
      const groupName = getFacetGroupName(group);
      if (!groupName) {
        return;
      }

      group.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
        if (getFacetValueFromLink(link, groupName) === "") {
          link.classList.add("cast-facet-all-option");
        }
      });
    });
  }

  private orderOptionsByCurrentDom(
    groupName: FacetGroupName,
    group: HTMLElement,
    options: ModalFacetOption[]
  ): ModalFacetOption[] {
    const currentOrder = new Map<string, number>();
    let index = 0;
    group.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      const slug = getFacetValueFromLink(link, groupName);
      if (!slug || currentOrder.has(slug)) {
        return;
      }
      currentOrder.set(slug, index);
      index += 1;
    });

    if (currentOrder.size === 0) {
      return options;
    }

    return [...options].sort((left, right) => {
      const leftIndex = currentOrder.get(left.slug);
      const rightIndex = currentOrder.get(right.slug);
      if (leftIndex !== undefined && rightIndex !== undefined) {
        return leftIndex - rightIndex;
      }
      if (leftIndex !== undefined) {
        return -1;
      }
      if (rightIndex !== undefined) {
        return 1;
      }
      return 0;
    });
  }

  private buildFacetHref(groupName: FacetGroupName, candidateValue: string): string {
    if (!this.form) {
      return "#";
    }

    const actionUrl = new URL(this.form.action, window.location.href);
    const params = new URLSearchParams();

    if (this.state.search) {
      params.set("search", this.state.search);
    }

    FACET_GROUP_NAMES.forEach((name) => {
      const value = name === groupName ? candidateValue : this.state.selected[name];
      if (value) {
        params.set(name, value);
      }
    });

    if (this.state.ordering) {
      params.set("o", this.state.ordering);
    }

    const query = params.toString();
    return query ? `${actionUrl.pathname}?${query}` : actionUrl.pathname;
  }

  private resetFacetToggleForGroup(group: HTMLElement): void {
    group.dataset.castFacetToggleReady = "";

    const toggle = group.parentElement?.querySelector<HTMLElement>("[data-cast-facet-toggle]");
    if (!toggle) {
      return;
    }

    const cleanedToggle = toggle.cloneNode(true) as HTMLElement;
    cleanedToggle.hidden = true;
    cleanedToggle.removeAttribute("aria-expanded");

    const showText = cleanedToggle.querySelector<HTMLElement>("[data-show-text]");
    const hideText = cleanedToggle.querySelector<HTMLElement>("[data-hide-text]");
    if (showText) {
      showText.hidden = false;
    }
    if (hideText) {
      hideText.hidden = true;
    }

    toggle.replaceWith(cleanedToggle);
  }

  private syncHiddenInputsFromState(): void {
    if (!this.form) {
      return;
    }

    FACET_GROUP_NAMES.forEach((groupName) => {
      syncFacetHiddenInput(this.form as HTMLFormElement, groupName, this.state.selected[groupName]);
    });
  }

  private getAllLabel(group: HTMLElement, groupName: FacetGroupName): string {
    const links = Array.from(group.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const allLink = links.find((link) => getFacetValueFromLink(link, groupName) === "");
    if (!allLink?.textContent) {
      return ALL_FACETS_LABEL;
    }

    const [rawLabel] = allLink.textContent.split("(");
    const label = rawLabel.trim();
    return label || ALL_FACETS_LABEL;
  }

  private applyNoResultsState(resultCount: number): void {
    this.latestResultCount = resultCount;
    this.updateNoResultsVisibility();
  }

  private handleSuggestionsOpenChange(open: boolean): void {
    this.suggestionsOpen = open;
    this.updateNoResultsVisibility();
  }

  private updateNoResultsVisibility(): void {
    if (this.noResultsElement) {
      this.noResultsElement.hidden =
        this.suggestionsOpen || this.latestResultCount === null || this.latestResultCount > 0;
    }
  }

  private setLoading(isLoading: boolean): void {
    if (this.modalBody) {
      if (isLoading) {
        this.modalBody.setAttribute("aria-busy", "true");
      } else {
        this.modalBody.removeAttribute("aria-busy");
      }
    }

    if (this.loadingElement) {
      if (isLoading) {
        this.clearLoadingTimer();
        this.state.loadingTimer = setTimeout(() => {
          if (this.loadingElement) {
            this.loadingElement.hidden = false;
          }
          this.state.loadingTimer = null;
        }, 180);
      } else {
        this.clearLoadingTimer();
        this.loadingElement.hidden = true;
      }
    }
  }

  private announceStatus(message: string): void {
    if (!this.statusElement) {
      return;
    }
    this.statusElement.textContent = message;
  }

  private expandActivePanels(): void {
    if (!this.modal || !this.form) {
      return;
    }

    this.modal.querySelectorAll<HTMLElement>("[data-cast-filter-panel]").forEach((panel) => {
      if (!(panel instanceof HTMLDetailsElement)) {
        return;
      }

      const name = panel.getAttribute("data-cast-filter-panel");
      if (!isFacetGroupName(name)) {
        return;
      }

      const hasHiddenValue = findManagedHiddenInputs(this.form as HTMLFormElement, name).some(
        (input) => input.value !== ""
      );
      if (hasHiddenValue) {
        panel.open = true;
      }
    });
  }
}

CastSearchModal.register("cast-search-modal");
