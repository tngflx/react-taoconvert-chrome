export function taoDownloader() {
    const all_sku_items = document.querySelectorAll('div.skuItemWrapper .skuItem')

    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector(".title").textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]').getAttribute("src")

    })
}