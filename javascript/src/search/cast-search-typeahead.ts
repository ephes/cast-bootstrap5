const TYPEAHEAD_DEBOUNCE_MS = 225;
const TYPEAHEAD_LOADING_DELAY_MS = 300;
const TYPEAHEAD_MIN_QUERY_LENGTH = 2;
const TYPEAHEAD_CACHE_MAX_ENTRIES = 50;
const FACET_NAMES = ["date_facets", "tag_facets", "category_facets"] as const;

type SearchSuggestion = {
  id: number;
  title: string;
  url: string;
};

type SearchSuggestionsResponse = {
  query: string;
  suggestions: SearchSuggestion[];
};

type TypeaheadElements = {
  input: HTMLInputElement;
  form: HTMLFormElement;
  listbox: HTMLElement;
  status: HTMLElement;
  loading: HTMLElement | null;
};

type TypeaheadActions = {
  navigate?: (url: string) => void;
  openInNewTab?: (url: string) => void;
  onOpenChange?: (open: boolean) => void;
  messages?: Partial<TypeaheadMessages>;
};

type TypeaheadMessages = {
  noSuggestions: string;
  unavailable: string;
  oneAvailable: string;
  manyAvailable: string;
};

const DEFAULT_MESSAGES: TypeaheadMessages = {
  noSuggestions: "No suggestions.",
  unavailable: "Suggestions unavailable. You can still search.",
  oneAvailable: "1 suggestion available.",
  manyAvailable: "{count} suggestions available.",
};

function isSuggestion(value: unknown): value is SearchSuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SearchSuggestion>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string"
  );
}

function isSuggestionsResponse(value: unknown): value is SearchSuggestionsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SearchSuggestionsResponse>;
  return (
    typeof candidate.query === "string" &&
    Array.isArray(candidate.suggestions) &&
    candidate.suggestions.every(isSuggestion)
  );
}

export default class CastSearchTypeahead {
  private readonly url: string;
  private readonly elements: TypeaheadElements;
  private readonly navigate: (url: string) => void;
  private readonly openInNewTab: (url: string) => void;
  private readonly onOpenChange: (open: boolean) => void;
  private readonly messages: TypeaheadMessages;
  private readonly cache = new Map<string, SearchSuggestionsResponse>();
  private suggestions: SearchSuggestion[] = [];
  private activeIndex = -1;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private loadingTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: AbortController | null = null;
  private requestSequence = 0;
  private connected = false;
  private consecutiveFailures = 0;
  private disabled = false;

  constructor(url: string, elements: TypeaheadElements, actions: TypeaheadActions = {}) {
    this.url = url;
    this.elements = elements;
    this.navigate = actions.navigate ?? ((destination) => window.location.assign(destination));
    this.openInNewTab =
      actions.openInNewTab ?? ((destination) => window.open(destination, "_blank", "noopener,noreferrer"));
    this.onOpenChange = actions.onOpenChange ?? (() => undefined);
    this.messages = {
      noSuggestions: actions.messages?.noSuggestions ?? DEFAULT_MESSAGES.noSuggestions,
      unavailable: actions.messages?.unavailable ?? DEFAULT_MESSAGES.unavailable,
      oneAvailable: actions.messages?.oneAvailable ?? DEFAULT_MESSAGES.oneAvailable,
      manyAvailable: actions.messages?.manyAvailable ?? DEFAULT_MESSAGES.manyAvailable,
    };
  }

  connect(): void {
    if (this.connected) {
      return;
    }
    this.connected = true;
    const { input, listbox } = this.elements;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", listbox.id);
    input.setAttribute("autocomplete", "off");
    input.setAttribute("enterkeyhint", "search");
    input.setAttribute("autocapitalize", "off");
    input.spellcheck = false;

    input.addEventListener("input", this.handleInput);
    input.addEventListener("search", this.handleInput);
    input.addEventListener("keydown", this.handleKeydown);
    input.addEventListener("blur", this.handleBlur);
    listbox.addEventListener("pointerdown", this.handlePointerDown);
    listbox.addEventListener("click", this.handleClick);
    listbox.addEventListener("pointermove", this.handlePointerMove);
    listbox.addEventListener("auxclick", this.handleAuxClick);
  }

  disconnect(): void {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    const { input, listbox } = this.elements;
    input.removeEventListener("input", this.handleInput);
    input.removeEventListener("search", this.handleInput);
    input.removeEventListener("keydown", this.handleKeydown);
    input.removeEventListener("blur", this.handleBlur);
    listbox.removeEventListener("pointerdown", this.handlePointerDown);
    listbox.removeEventListener("click", this.handleClick);
    listbox.removeEventListener("pointermove", this.handlePointerMove);
    listbox.removeEventListener("auxclick", this.handleAuxClick);
    this.clearTimers();
    this.abortRequest();
    this.close();
  }

  facetStateChanged(): void {
    this.invalidateSuggestions();
    this.schedule();
  }

  resume(): void {
    this.disabled = false;
    this.consecutiveFailures = 0;
  }

  private readonly handleInput = (): void => {
    this.invalidateSuggestions();
    this.schedule();
  };

  private invalidateSuggestions(): void {
    this.clearDebounce();
    this.abortRequest();
    this.suggestions = [];
    this.render();
    this.close();
    this.announce("");
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key === "Tab") {
      this.close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (this.suggestions.length === 0) {
        return;
      }
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const start = this.activeIndex === -1 ? (delta === 1 ? -1 : 0) : this.activeIndex;
      this.setActive((start + delta + this.suggestions.length) % this.suggestions.length);
      return;
    }

    if (event.key === "Enter" && this.activeIndex >= 0) {
      const suggestion = this.suggestions[this.activeIndex];
      if (!suggestion) {
        return;
      }
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        this.openInNewTab(suggestion.url);
      } else {
        this.navigate(suggestion.url);
      }
    }
  };

  private readonly handleBlur = (): void => {
    queueMicrotask(() => this.close());
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if ((event.target as Element | null)?.closest<HTMLElement>("[role=option]")) {
      event.preventDefault();
    }
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const option = (event.target as Element | null)?.closest<HTMLElement>("[role=option]");
    const index = option ? Number(option.dataset.suggestionIndex) : Number.NaN;
    const suggestion = this.suggestions[index];
    if (suggestion) {
      this.navigate(suggestion.url);
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const option = (event.target as Element | null)?.closest<HTMLElement>("[role=option]");
    const index = option ? Number(option.dataset.suggestionIndex) : Number.NaN;
    if (Number.isInteger(index) && index !== this.activeIndex) {
      this.setActive(index);
    }
  };

  private readonly handleAuxClick = (event: MouseEvent): void => {
    if (event.button !== 1) {
      return;
    }
    const option = (event.target as Element | null)?.closest<HTMLElement>("[role=option]");
    const index = option ? Number(option.dataset.suggestionIndex) : Number.NaN;
    const suggestion = this.suggestions[index];
    if (suggestion) {
      event.preventDefault();
      this.openInNewTab(suggestion.url);
    }
  };

  private schedule(): void {
    if (this.disabled) {
      return;
    }
    this.clearDebounce();
    const query = this.elements.input.value.trim();
    if (query.length < TYPEAHEAD_MIN_QUERY_LENGTH) {
      this.abortRequest();
      this.suggestions = [];
      this.close();
      this.announce("");
      return;
    }

    const key = this.buildKey();
    const cached = this.cache.get(key);
    if (cached) {
      this.applyResponse(cached, key);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      void this.fetchSuggestions(key);
    }, TYPEAHEAD_DEBOUNCE_MS);
  }

  private async fetchSuggestions(key: string): Promise<void> {
    this.abortRequest();
    const controller = new AbortController();
    this.inFlight = controller;
    const sequence = ++this.requestSequence;
    this.loadingTimer = setTimeout(() => this.setLoading(true), TYPEAHEAD_LOADING_DELAY_MS);

    try {
      const response = await fetch(this.buildUrl(key), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as unknown;
      if (!isSuggestionsResponse(payload)) {
        throw new Error("Invalid suggestion response");
      }
      if (sequence !== this.requestSequence || key !== this.buildKey()) {
        return;
      }
      this.consecutiveFailures = 0;
      this.setCache(key, payload);
      this.applyResponse(payload, key);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (sequence !== this.requestSequence || key !== this.buildKey()) {
        return;
      }
      this.consecutiveFailures += 1;
      this.suggestions = [];
      this.render();
      this.close();
      this.announceWhileFocused(this.messages.unavailable);
      if (this.consecutiveFailures >= 2) {
        this.disabled = true;
      }
    } finally {
      if (this.inFlight === controller) {
        this.inFlight = null;
        this.setLoading(false);
      }
    }
  }

  private applyResponse(payload: SearchSuggestionsResponse, key: string): void {
    if (key !== this.buildKey()) {
      return;
    }
    this.suggestions = payload.suggestions;
    this.activeIndex = -1;
    this.render();
    if (this.suggestions.length === 0) {
      this.close();
      this.announceWhileFocused(this.messages.noSuggestions);
      return;
    }
    if (!this.open()) {
      this.announce("");
      return;
    }
    const message =
      this.suggestions.length === 1
        ? this.messages.oneAvailable
        : this.messages.manyAvailable.replace("{count}", String(this.suggestions.length));
    this.announce(message);
  }

  private render(): void {
    const fragment = document.createDocumentFragment();
    this.suggestions.forEach((suggestion, index) => {
      const option = document.createElement("li");
      option.id = `${this.elements.listbox.id}-option-${suggestion.id}`;
      option.className = "cast-search-suggestion";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.dataset.suggestionIndex = String(index);
      option.dataset.url = suggestion.url;

      const title = document.createElement("span");
      title.className = "cast-search-suggestion-title";
      title.textContent = suggestion.title;
      option.appendChild(title);

      fragment.appendChild(option);
    });
    this.elements.listbox.replaceChildren(fragment);
  }

  private setActive(index: number): void {
    this.activeIndex = index;
    const options = Array.from(this.elements.listbox.querySelectorAll<HTMLElement>("[role=option]"));
    options.forEach((option, optionIndex) => {
      const active = optionIndex === index;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        this.elements.input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest" });
      }
    });
  }

  private open(): boolean {
    if (this.suggestions.length === 0 || document.activeElement !== this.elements.input) {
      return false;
    }
    this.elements.listbox.hidden = false;
    this.elements.input.setAttribute("aria-expanded", "true");
    this.onOpenChange(true);
    return true;
  }

  private close(): void {
    const wasOpen = this.isOpen();
    this.elements.listbox.hidden = true;
    this.elements.input.setAttribute("aria-expanded", "false");
    this.clearActive();
    if (wasOpen) {
      this.onOpenChange(false);
    }
  }

  private clearActive(): void {
    this.elements.input.removeAttribute("aria-activedescendant");
    this.elements.listbox.querySelectorAll<HTMLElement>("[role=option]").forEach((option) => {
      option.classList.remove("is-active");
      option.setAttribute("aria-selected", "false");
    });
    this.activeIndex = -1;
  }

  private isOpen(): boolean {
    return !this.elements.listbox.hidden;
  }

  private buildUrl(key: string): string {
    const url = new URL(this.url, window.location.href);
    url.search = key;
    return url.toString();
  }

  private buildKey(): string {
    return this.buildParams().toString();
  }

  private buildParams(): URLSearchParams {
    const params = new URLSearchParams();
    const query = this.elements.input.value.trim();
    if (query) {
      params.set("search", query);
    }
    FACET_NAMES.forEach((name) => {
      const value = this.elements.form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? "";
      if (value) {
        params.set(name, value);
      }
    });
    return params;
  }

  private setCache(key: string, payload: SearchSuggestionsResponse): void {
    this.cache.delete(key);
    this.cache.set(key, payload);
    if (this.cache.size <= TYPEAHEAD_CACHE_MAX_ENTRIES) {
      return;
    }
    const oldest = this.cache.keys().next().value;
    if (oldest !== undefined) {
      this.cache.delete(oldest);
    }
  }

  private announce(message: string): void {
    this.elements.status.textContent = message;
  }

  private announceWhileFocused(message: string): void {
    this.announce(document.activeElement === this.elements.input ? message : "");
  }

  private setLoading(loading: boolean): void {
    this.clearLoadingTimer();
    this.elements.listbox.setAttribute("aria-busy", loading ? "true" : "false");
    if (this.elements.loading) {
      this.elements.loading.hidden = !loading;
    }
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private clearLoadingTimer(): void {
    if (this.loadingTimer !== null) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearDebounce();
    this.clearLoadingTimer();
  }

  private abortRequest(): void {
    this.requestSequence += 1;
    this.inFlight?.abort();
    this.inFlight = null;
    this.setLoading(false);
  }
}
