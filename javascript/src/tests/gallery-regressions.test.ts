import { afterEach, expect, test, vi } from "vitest";
import CastSearchModal from "@/search/cast-search-modal";
import ImageGalleryBs5 from "@/gallery/image-gallery-bs5";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function fixture() {
    const gallery = new ImageGalleryBs5();
    gallery.innerHTML = `
        <div class="cast-gallery-container"><a data-bs-target="#regression-modal"><picture>
        <source data-modal-src="first.avif" data-modal-srcset="first.avif 1000w" data-modal-sizes="100vw" type="image/avif" />
        <img id="first" alt="First" data-next="second" data-prev="false" data-modal-src="first.jpg" data-modal-srcset="first.jpg 1000w" data-modal-sizes="100vw" data-modal-width="1000" data-modal-height="500" /></picture></a></div>
        <picture><source /><img id="second" alt="" data-modal-src="second.jpg" data-prev="first" data-next="false" /></picture>
        <div id="regression-modal" class="modal fade" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
        <div class="modal-body"><a><picture><source /><img /></picture></a></div><div class="modal-footer"></div>
        </div></div></div>`;
    document.body.appendChild(gallery);
    return gallery;
}

afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    document.body.removeAttribute("style");
    vi.useRealTimers();
    delete (window as any).bootstrap;
});

test("navigation copies empty attributes and removes absent metadata", () => {
    const gallery = fixture();
    gallery.setModalImage(gallery.querySelector("#first")!);
    const image = gallery.currentModal!.querySelector("img")!;
    const source = gallery.currentModal!.querySelector("source")!;
    expect(image.getAttribute("alt")).toBe("First");
    expect(source.getAttribute("type")).toBe("image/avif");
    gallery.replaceImage("data-next");
    expect(image.getAttribute("alt")).toBe("");
    expect(image.getAttribute("src")).toBe("second.jpg");
    for (const attr of ["srcset", "sizes", "width", "height"]) expect(image.hasAttribute(attr)).toBe(false);
    for (const attr of ["src", "srcset", "sizes", "type"]) expect(source.hasAttribute(attr)).toBe(false);
    expect(image.style.aspectRatio).toBe("");
    const second = gallery.querySelector<HTMLElement>("#second")!;
    second.removeAttribute("alt");
    second.previousElementSibling!.setAttribute("data-modal-sizes", "");
    gallery.setModalImage(second);
    expect(image.hasAttribute("alt")).toBe(false);
    expect(source.getAttribute("sizes")).toBe("");
});

test("footer navigation preserves keyboard focus, falls back at endpoints and ignores late loads", () => {
    const gallery = fixture();
    const modal = open(gallery);
    const next = modal.querySelector<HTMLButtonElement>("#data-next")!;
    next.focus();
    next.click();
    const prev = modal.querySelector<HTMLButtonElement>("#data-prev")!;
    expect(document.activeElement).toBe(prev);
    expect(modal.querySelector<HTMLButtonElement>("#data-next")!.disabled).toBe(true);
    prev.click();
    expect(document.activeElement).toBe(modal.querySelector("#data-next"));
    modal.querySelector("img")!.dispatchEvent(new Event("error"));
    expect(document.activeElement).toBe(modal.querySelector("#data-next"));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    gallery.replaceImage("data-next");
    expect(document.activeElement).toBe(input);
});

test("footer focus falls back to the modal when both directions disappear", () => {
    const gallery = fixture();
    const modal = open(gallery);
    modal.removeAttribute("tabindex");
    const next = modal.querySelector<HTMLButtonElement>("#data-next")!;
    next.focus();
    const second = gallery.querySelector<HTMLImageElement>("#second")!;
    second.setAttribute("data-prev", "false");
    next.click();
    expect(document.activeElement).toBe(modal);
    expect(modal.getAttribute("tabindex")).toBe("-1");
});

function bootstrapModal() {
    // Exercise the exact Bootstrap bundle shipped by this theme, including focus trap.
    window.eval(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../cast_bootstrap5/static/cast_bootstrap5/js/bootstrap5/bootstrap.bundle.min.js"), "utf8"));
    return (window as any).bootstrap.Modal;
}

function open(gallery: ImageGalleryBs5) {
    gallery.querySelector<HTMLElement>(".cast-gallery-container > a")!.click();
    return gallery.currentModal!;
}

test.each(["shown", "showing", "hiding", "backdrop-hiding", "closed"])("disconnect disposes actual Bootstrap modal when %s", (phase) => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "7px";
    const gallery = fixture();
    const modal = open(gallery);
    if (phase !== "showing") vi.runAllTimers();
    const instance = Modal.getInstance(modal);
    expect(instance).not.toBeNull();
    const hidden = vi.fn();
    modal.addEventListener("hidden.bs.modal", hidden);
    if (phase === "hiding" || phase === "backdrop-hiding" || phase === "closed") instance.hide();
    if (phase === "backdrop-hiding") {
        // Bootstrap adds 5ms to jsdom's zero-duration modal fade; the backdrop is next.
        vi.advanceTimersByTime(5);
        expect(modal.style.display).toBe("none");
        expect(hidden).not.toHaveBeenCalled();
        expect(document.querySelector(".modal-backdrop")).not.toBeNull();
    }
    if (phase === "closed") vi.runAllTimers();
    gallery.remove();
    vi.runAllTimers();
    expect(modal.isConnected).toBe(false);
    expect(Modal.getInstance(modal)).toBeNull();
    expect(document.querySelector(".modal-backdrop")).toBeNull();
    expect(document.body.classList.contains("modal-open")).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.paddingRight).toBe("7px");
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);
});

test.each([false, true])("fallback disconnect preserves another modal's body lock: %s", (other) => {
    const gallery = fixture();
    const modal = open(gallery);
    if (other) {
        const another = document.createElement("div");
        another.className = "modal show";
        document.body.appendChild(another);
    }
    gallery.remove();
    expect(modal.isConnected).toBe(false);
    expect(document.body.classList.contains("modal-open")).toBe(other);
});

test("Bootstrap disconnect preserves another active modal", () => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const modal = open(gallery);
    vi.runAllTimers();
    const another = document.createElement("div");
    another.className = "modal";
    another.tabIndex = -1;
    another.innerHTML = '<div class="modal-dialog"><div class="modal-content"><button>Other</button></div></div>';
    document.body.appendChild(another);
    const otherInstance = Modal.getOrCreateInstance(another);
    otherInstance.show();
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const otherBackdrop = document.querySelectorAll(".modal-backdrop")[1];
    gallery.remove();
    vi.runAllTimers();
    expect(Modal.getInstance(modal)).toBeNull();
    expect(otherBackdrop.isConnected).toBe(true);
    expect(document.querySelectorAll(".modal-backdrop")).toHaveLength(1);
    expect(document.body.classList.contains("modal-open")).toBe(true);
    expect(document.body.style.overflow).toBe(overflow);
    expect(document.body.style.paddingRight).toBe(padding);
    expect(Modal.getInstance(another)).toBe(otherInstance);
    otherInstance.hide();
    otherInstance.dispose();
});

test("reopening an already shown modal does not leave stale opening state", () => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const modal = open(gallery);
    vi.runAllTimers();
    open(gallery);
    Modal.getInstance(modal).hide();
    vi.runAllTimers();
    gallery.remove();
    vi.runAllTimers();
    expect(modal.isConnected).toBe(false);
    expect(Modal.getInstance(modal)).toBeNull();
});

test("cancelled Bootstrap opening can be disposed on disconnect", () => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const modal = gallery.querySelector<HTMLElement>(".modal")!;
    modal.addEventListener("show.bs.modal", event => event.preventDefault(), { once: true });
    open(gallery);
    gallery.remove();
    vi.runAllTimers();
    expect(modal.isConnected).toBe(false);
    expect(Modal.getInstance(modal)).toBeNull();
    expect(document.querySelector(".modal-backdrop")).toBeNull();
});

test.each([
    { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true },
    { button: 1 }, { button: 2 },
])("thumbnail preserves native gesture %j", (gesture) => {
    const gallery = fixture();
    const link = gallery.querySelector<HTMLAnchorElement>(".cast-gallery-container > a")!;
    link.href = "#original";
    const show = vi.fn();
    (window as any).bootstrap = { Modal: { getOrCreateInstance: () => ({ show }) } };
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...gesture });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(gallery.currentImage).toBeNull();
});

test.each(["cancelled", "target", "download"])("thumbnail preserves %s activation", (kind) => {
    const gallery = fixture();
    const link = gallery.querySelector<HTMLAnchorElement>(".cast-gallery-container > a")!;
    link.href = "#original";
    if (kind === "target") link.target = "_blank";
    if (kind === "download") link.download = "image.jpg";
    const show = vi.fn();
    (window as any).bootstrap = { Modal: { getOrCreateInstance: () => ({ show }) } };
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    if (kind === "cancelled") event.preventDefault();
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(kind === "cancelled");
    expect(show).not.toHaveBeenCalled();
});

test.each([0, 1])("ordinary keyboard/pointer activation opens modal (detail %s)", (detail) => {
    const gallery = fixture();
    const show = vi.fn();
    (window as any).bootstrap = { Modal: { getOrCreateInstance: () => ({ show }) } };
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, detail });
    gallery.querySelector(".cast-gallery-container > a")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(show).toHaveBeenCalledOnce();
});

test.each(["escape", "button"])("closing with %s restores the keyboard opener after hidden", (method) => {
    vi.useFakeTimers();
    bootstrapModal();
    const gallery = fixture();
    const link = gallery.querySelector<HTMLAnchorElement>(".cast-gallery-container > a")!;
    link.href = "#original";
    link.focus();
    const modal = open(gallery);
    vi.advanceTimersByTime(30);
    const close = document.createElement("button");
    close.setAttribute("data-bs-dismiss", "modal");
    modal.querySelector(".modal-content")!.prepend(close);
    close.focus();
    expect(document.activeElement).toBe(close);
    if (method === "escape") modal.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    else close.click();
    expect(document.activeElement).not.toBe(link);
    vi.advanceTimersByTime(30);
    expect(document.activeElement).toBe(link);
});

test.each(["gallery", "trigger", "other-modal"])("closing does not restore stale focus: %s", (reason) => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const link = gallery.querySelector<HTMLAnchorElement>(".cast-gallery-container > a")!;
    link.href = "#original";
    const modal = open(gallery);
    vi.advanceTimersByTime(30);
    Modal.getInstance(modal).hide();
    if (reason === "gallery") gallery.remove();
    if (reason === "trigger") link.remove();
    const elsewhere = document.createElement("button");
    if (reason === "other-modal") {
        const other = document.createElement("div");
        other.className = "modal show";
        other.append(elsewhere);
        document.body.append(other);
    } else document.body.append(elsewhere);
    elsewhere.focus();
    vi.advanceTimersByTime(30);
    expect(document.activeElement).toBe(elsewhere);
});

test.each(["error", "deadline"])("image %s exposes recovery and a retry can succeed", (failure) => {
    vi.useFakeTimers();
    const gallery = fixture();
    gallery.querySelector("a")!.setAttribute("data-full", "/original.jpg");
    const modal = open(gallery);
    const image = modal.querySelector<HTMLImageElement>(".modal-body img")!;
    const body = modal.querySelector<HTMLElement>(".modal-body")!;
    if (failure === "error") image.dispatchEvent(new Event("error"));
    else vi.advanceTimersByTime(10000);
    expect(body.getAttribute("aria-busy")).toBe("false");
    expect(body.querySelector<HTMLElement>(".cast-gallery-loading-indicator")!.style.display).toBe("none");
    expect(image.style.opacity).toBe("0");
    const error = body.querySelector<HTMLElement>('[role="alert"]')!;
    expect(error).not.toBeNull();
    expect(error.textContent).toContain("Could not load image");
    expect(error.querySelector("a")!.getAttribute("href")).toBe("/original.jpg");
    error.querySelector("button")!.click();
    expect(body.querySelector('[role="alert"]')).toBeNull();
    expect(body.getAttribute("aria-busy")).toBe("true");
    image.dispatchEvent(new Event("load"));
    expect(body.getAttribute("aria-busy")).toBe("false");
    expect(image.style.opacity).toBe("1");
    vi.advanceTimersByTime(10000);
    expect(body.querySelector('[role="alert"]')).toBeNull();
});

test("switch cancels the old image deadline and stale error handler", () => {
    vi.useFakeTimers();
    const gallery = fixture();
    const image = gallery.querySelector<HTMLImageElement>(".modal-body img")!;
    const listen = vi.spyOn(image, "addEventListener");
    const modal = open(gallery);
    const oldError = listen.mock.calls.find(([type]) => type === "error")![1] as EventListener;
    vi.advanceTimersByTime(5000);
    gallery.replaceImage("data-next");
    oldError(new Event("error"));
    vi.advanceTimersByTime(5000);
    expect(modal.querySelector(".modal-body")!.getAttribute("aria-busy")).toBe("true");
    expect(modal.querySelector('[role="alert"]')).toBeNull();
    image.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(10000);
    expect(modal.querySelector('[role="alert"]')).toBeNull();
});

test.each(["close", "disconnect"])("%s cancels pending image work", (action) => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const modal = open(gallery);
    vi.advanceTimersByTime(30);
    const image = modal.querySelector<HTMLImageElement>(".modal-body img")!;
    if (action === "close") Modal.getInstance(modal).hide();
    else gallery.remove();
    vi.advanceTimersByTime(10000);
    image.dispatchEvent(new Event("error"));
    expect(modal.querySelector(".modal-body")!.getAttribute("aria-busy")).toBe("false");
    expect(modal.querySelector('[role="alert"]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
});

test("cancelled opening retires pending image listeners and deadline", () => {
    vi.useFakeTimers();
    bootstrapModal();
    const gallery = fixture();
    const modal = gallery.querySelector<HTMLElement>(".modal")!;
    modal.addEventListener("show.bs.modal", event => event.preventDefault(), { once: true });
    open(gallery);
    const body = modal.querySelector(".modal-body")!;
    expect(body.getAttribute("aria-busy")).toBe("false");
    vi.advanceTimersByTime(10000);
    modal.querySelector("img")!.dispatchEvent(new Event("error"));
    expect(body.querySelector('[role="alert"]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
});

test("vetoed Bootstrap hide preserves the pending image deadline and retry", async () => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const modal = open(gallery);
    vi.advanceTimersByTime(30);
    modal.addEventListener('hide.bs.modal', event => event.preventDefault(), { once: true });
    Modal.getInstance(modal).hide();
    await Promise.resolve();
    expect(modal.classList.contains('show')).toBe(true);
    expect(modal.querySelector('.modal-body')!.getAttribute('aria-busy')).toBe('true');
    vi.advanceTimersByTime(10000);
    expect(modal.querySelector('[role="alert"]')).not.toBeNull();
    modal.querySelector<HTMLButtonElement>('.cast-gallery-error button')!.click();
    gallery.replaceImage('data-next');
    modal.querySelector('img')!.dispatchEvent(new Event('load'));
    Modal.getInstance(modal).hide();
    vi.advanceTimersByTime(30);
    expect(modal.classList.contains('show')).toBe(false);
});

test.each(['opening', 'closing'])("reconnect during %s cannot adopt a retiring Bootstrap modal", (phase) => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    const gallery = fixture();
    const retired = open(gallery);
    if (phase === 'closing') {
        vi.advanceTimersByTime(30);
        Modal.getInstance(retired).hide();
    }
    gallery.remove();
    document.body.append(gallery);
    const replacement = open(gallery);
    expect(replacement).not.toBe(retired);
    expect(replacement).not.toBeNull();
    vi.advanceTimersByTime(50);
    expect(retired.isConnected).toBe(false);
    expect(Modal.getInstance(retired)).toBeNull();
    expect(gallery.currentModal).toBe(replacement);
    expect(replacement.isConnected).toBe(true);
    expect(replacement.classList.contains('show')).toBe(true);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
    Modal.getInstance(replacement).hide();
    vi.advanceTimersByTime(30);
    expect(document.body.style.overflow).toBe('');
});

test.each(['input', 'textarea', 'select', 'button', 'a', 'editable', 'modified', 'composing', 'cancelled', 'image'])("arrow key ownership at %s", (kind) => {
    const gallery = fixture();
    const modal = open(gallery);
    const el = document.createElement(kind === 'editable' ? 'div' : ['modified', 'composing', 'cancelled', 'image'].includes(kind) ? 'span' : kind);
    if (kind === 'editable') el.setAttribute('contenteditable', 'true');
    if (kind === 'a') el.setAttribute('href', '#native');
    modal.querySelector('.modal-body')!.append(el);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, ctrlKey: kind === 'modified', isComposing: kind === 'composing' });
    if (kind === 'cancelled') event.preventDefault();
    el.dispatchEvent(event);
    expect(gallery.currentImage!.id).toBe(kind === 'image' ? 'second' : 'first');
    expect(event.defaultPrevented).toBe(kind === 'image' || kind === 'cancelled');
    if (kind === 'image') {
        const end = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
        el.dispatchEvent(end);
        expect(end.defaultPrevented).toBe(false);
    }
});

test.each(['img', 'thumbnail-source', 'body', 'footer', 'modal-source', 'modal-image', 'target'])("malformed %s preserves native navigation and prior modal", (missing) => {
    const gallery = fixture();
    const modal = open(gallery);
    const current = gallery.currentImage;
    const before = modal.innerHTML;
    const link = gallery.querySelector<HTMLAnchorElement>('.cast-gallery-container > a')!;
    link.href = '#native';
    const old = link.cloneNode(true) as HTMLAnchorElement;
    // Rebind after constructing an additional broken thumbnail.
    gallery.querySelector('.cast-gallery-container')!.append(old);
    gallery.connectedCallback();
    if (missing === 'img') old.querySelector('img')!.remove();
    if (missing === 'thumbnail-source') old.querySelector('source')!.remove();
    if (missing === 'target') old.setAttribute('data-bs-target', '#does-not-exist');
    if (['body', 'footer', 'modal-source', 'modal-image'].includes(missing)) {
        const broken = modal.cloneNode(true) as HTMLElement;
        broken.id = 'broken-modal';
        gallery.append(broken);
        const selector = { body: '.modal-body', footer: '.modal-footer', 'modal-source': 'source', 'modal-image': 'img' }[missing]!;
        broken.querySelector(selector)!.remove();
        old.setAttribute('data-bs-target', '#broken-modal');
    }
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    old.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(gallery.currentImage).toBe(current);
    expect(gallery.currentModal).toBe(modal);
    expect(modal.innerHTML).toBe(before);
});

test.each(['photo:2', 'photo[2]', '2photo'])("navigation resolves literal owned ID %s", (id) => {
    const gallery = fixture();
    const second = gallery.querySelector<HTMLElement>('#second')!;
    second.id = id;
    gallery.querySelector('#first')!.setAttribute('data-next', id);
    open(gallery);
    expect(() => gallery.replaceImage('data-next')).not.toThrow();
    expect(gallery.currentImage).toBe(second);
});

test.each(['[invalid', '#foreign-modal'])("invalid or foreign target %s falls back without state changes", (target) => {
    const gallery = fixture();
    const other = fixture();
    other.id = 'other-gallery';
    other.querySelector('.modal')!.id = 'foreign-modal';
    const link = gallery.querySelector('a')!;
    link.setAttribute('data-bs-target', target);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const errors: Event[] = [];
    const onError = (event: Event) => { errors.push(event); event.preventDefault(); };
    window.addEventListener('error', onError);
    link.dispatchEvent(event);
    window.removeEventListener('error', onError);
    expect(errors).toHaveLength(0);
    expect(event.defaultPrevented).toBe(false);
    expect(gallery.currentModal).toBeNull();
    expect(other.currentModal).toBeNull();
});


test.each(['search-first', 'bootstrap-first', 'detach', 'veto'])("search and real Bootstrap share scroll ownership: %s", async (order) => {
    vi.useFakeTimers();
    const Modal = bootstrapModal();
    document.body.style.overflow = 'scroll';
    const search = new CastSearchModal();
    search.innerHTML = '<div data-cast-search-overlay hidden><div class="cast-search-modal"><form><input name="search"></form></div></div>';
    document.body.append(search);
    const gallery = fixture();
    let modal: HTMLElement;
    if (order === 'bootstrap-first') { modal = open(gallery); search.openModal(); }
    else { search.openModal(); modal = open(gallery); }
    vi.advanceTimersByTime(30);
    if (order === 'veto') {
        modal.addEventListener('hide.bs.modal', event => event.preventDefault(), { once: true });
        Modal.getInstance(modal).hide();
        await Promise.resolve();
    }
    if (order === 'search-first' || order === 'veto') search.closeModal();
    else if (order === 'detach') search.remove();
    else { Modal.getInstance(modal).hide(); vi.advanceTimersByTime(30); }
    expect(document.body.style.overflow).toBe('hidden');
    if (order === 'bootstrap-first') search.closeModal();
    else { Modal.getInstance(modal).hide(); vi.advanceTimersByTime(30); }
    expect(document.body.style.overflow).toBe('scroll');
});
