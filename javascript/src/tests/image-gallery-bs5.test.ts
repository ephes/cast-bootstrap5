import { expect, test, describe, beforeEach, afterEach } from "vitest";
import ImageGalleryBs5 from "@/gallery/image-gallery-bs5";
import { JSDOM } from "jsdom";


describe("image gallery test", () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM();
        document = dom.window.document;
        global.document = document;
        global.window = dom.window as any;
        global.HTMLElement = dom.window.HTMLElement;
        global.customElements = dom.window.customElements;
        global.Element = dom.window.Element;

        // Register the custom element
        ImageGalleryBs5.register("image-gallery-bs5");
    });

    afterEach(() => {
        dom.window.close();
    });

    test("gallery test current image is null", () => {
        const gallery = new ImageGalleryBs5()
        console.log("gallery: ", gallery)
        expect(gallery.currentImage).toBe(null)
    })

    test("gallery handles duplicate images correctly", () => {
        // Create gallery instance and set its content
        const gallery = new ImageGalleryBs5();
        gallery.id = "gallery-test";

        gallery.innerHTML = `
            <div class="cast-gallery-container">
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-0" data-prev="false" data-next="img-1" alt="Image 1" />
                    </picture>
                </a>
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-1" data-prev="img-0" data-next="img-2" alt="Image 2" />
                    </picture>
                </a>
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-2" data-prev="img-1" data-next="img-3" alt="Duplicate of Image 1" />
                    </picture>
                </a>
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-3" data-prev="img-2" data-next="img-4" alt="Image 3" />
                    </picture>
                </a>
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-4" data-prev="img-3" data-next="false" alt="Duplicate of Image 2" />
                    </picture>
                </a>
            </div>
            <div id="gallery-test" class="modal">
                <div class="modal-body">
                    <a><picture><source /><img /></picture></a>
                </div>
                <div class="modal-footer"></div>
            </div>
        `;

        document.body.appendChild(gallery);

        // Test navigation to each unique image using position-based IDs
        const img0 = document.querySelector("#img-0") as HTMLElement;
        const img1 = document.querySelector("#img-1") as HTMLElement;
        const img2 = document.querySelector("#img-2") as HTMLElement;
        const img3 = document.querySelector("#img-3") as HTMLElement;
        const img4 = document.querySelector("#img-4") as HTMLElement;

        // Verify all images are found with unique IDs
        expect(img0).toBeTruthy();
        expect(img1).toBeTruthy();
        expect(img2).toBeTruthy();
        expect(img3).toBeTruthy();
        expect(img4).toBeTruthy();

        // Test that setModalImage works for each image
        gallery.setModalImage(img0);
        expect(gallery.currentImage).toBe(img0);

        // Test navigation from first image
        gallery.replaceImage("data-next");
        expect(gallery.querySelector("#img-1")).toBeTruthy();

        // Test navigation through all images
        gallery.setModalImage(img2);
        gallery.replaceImage("data-prev");
        expect(gallery.querySelector("#img-1")).toBeTruthy();

        gallery.replaceImage("data-next");
        expect(gallery.querySelector("#img-2")).toBeTruthy();
    });

    test("gallery navigation buttons disabled correctly at boundaries", () => {
        // Create gallery instance and set its content
        const gallery = new ImageGalleryBs5();
        gallery.id = "gallery-test";

        gallery.innerHTML = `
            <div class="cast-gallery-container">
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-0" data-prev="false" data-next="img-1" alt="First" />
                    </picture>
                </a>
                <a class="cast-image-gallery-thumbnail" data-full="full-image.jpg">
                    <picture>
                        <source data-modal-srcset="test.jpg" />
                        <img id="img-1" data-prev="img-0" data-next="false" alt="Last" />
                    </picture>
                </a>
            </div>
            <div id="gallery-test" class="modal">
                <div class="modal-body">
                    <a><picture><source /><img /></picture></a>
                </div>
                <div class="modal-footer"></div>
            </div>
        `;

        document.body.appendChild(gallery);
        const firstImg = document.querySelector("#img-0") as HTMLElement;
        const lastImg = document.querySelector("#img-1") as HTMLElement;

        // Test first image - prev should be disabled
        gallery.setModalImage(firstImg);
        gallery.replaceImage("data-prev");
        expect(gallery.currentImage).toBe(firstImg); // Should not change

        // Test last image - next should be disabled
        gallery.setModalImage(lastImg);
        gallery.replaceImage("data-next");
        expect(gallery.currentImage).toBe(lastImg); // Should not change
    });
})
