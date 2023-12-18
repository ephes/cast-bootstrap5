import { expect, test, describe } from "vitest";
import ImageGallery from "@/gallery/image-gallery";


describe("image gallery test", () => {
    test("gallery test current image is null", () => {
        const gallery = new ImageGallery()
        console.log("gallery: ", gallery)
        expect(gallery.currentImage).toBe(null)
        // const sum: number = 1 + 1
        // expect(sum).toBe(2)
    })
})
