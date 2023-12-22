import { expect, test, describe } from "vitest";
import ImageGalleryBs5 from "@/gallery/image-gallery-bs5";


describe("image gallery test", () => {
    test("gallery test current image is null", () => {
        const gallery = new ImageGalleryBs5()
        console.log("gallery: ", gallery)
        expect(gallery.currentImage).toBe(null)
        // const sum: number = 1 + 1
        // expect(sum).toBe(2)
    })
})
