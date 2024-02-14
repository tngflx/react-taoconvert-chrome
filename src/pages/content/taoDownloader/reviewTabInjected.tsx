import React, { useEffect, useState } from "react"
import useStorage from "../../../shared/hooks/useStorage";
import dataStore from "../../../shared/storages/reviewItemSkuBase";
import { convertImageUrl } from "../utils/imageResize";

export async function processReviewTab() {
    let { href: currentURL, origin: domain, search: queryString, pathname } = window.location
    const queryParams = new URLSearchParams(queryString);

    const url_param_data = { "itemId": queryParams.get('id'), "bizCode": "ali.china.tmall", "channel": "pc_detail", "pageSize": 20, "pageNum": 1 }

    const h5api_review_data: { data: any } = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ msg_action: 'get_itempage_reviews', url_param_data }, h5api_data => {
            resolve(h5api_data)
        })
    })
    const { data: { module: { reviewVOList } } } = h5api_review_data;

    const remapped_review_data = reviewVOList
        .map(review => {
            const { reviewAppendVO } = review;
            const revPicPathList = review.reviewPicPathList || (reviewAppendVO?.reviewPicPathList || []);

            if (reviewAppendVO) {
                const { appendedWordContent } = reviewAppendVO;
                return {
                    revPicPathList,
                    reviewDate: review.reviewDate,
                    skuText: review.skuText,
                    reviewWordContent: review.reviewWordContent,
                    reviewAppendVO: appendedWordContent ? { appendedWordContent, reviewPicPathList: reviewAppendVO.reviewPicPathList } : undefined
                };
            }

            return {
                revPicPathList,
                reviewDate: review.reviewDate,
                skuText: review.skuText,
                reviewWordContent: review.reviewWordContent
            };
        })
        .filter(entry => Object.values(entry).every(value => value !== null && value !== undefined));

    return remapped_review_data
}

export const ImageTiles = ({ isLoading }) => {
    const data = useStorage(dataStore);

    useEffect(() => {
        isLoading = true;
        const { remappedReviewData } = data;
        if (remappedReviewData)
            isLoading = false;
    }, []);

    return (
        <div className="grid grid-cols-8 gap-4 mt-4">
            {data.remappedReviewData.map(({ revPicPathList, skuText }, parentIndex) => (
                <div key={parentIndex} className="col-span-4 flex flex-col items-center justify-center">
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                        {revPicPathList.map((link, childIndex) => (
                            <React.Fragment key={childIndex}>
                                <img
                                    src={convertImageUrl(link, 100, 90)}
                                    alt={`Image ${parentIndex + 1}.${childIndex + 1}`}
                                    className="w-full h-[100px] object-cover rounded-md mb-2"
                                />
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="text-sm mt-2 text-center">skuText</p>
                </div>
            ))}
        </div>
    );

}

let flat_comment_photos;
function reviewTabScrape() {
    let commentTabToObserve = 'div[class^="Tabs--root"] [class^="Tabs--container"]';

    const review_tab_container = document.querySelector(commentTabToObserve)
    const review_with_pic_orvid = review_tab_container.querySelectorAll('div[class^="Comments--tagList"] button.detail-btn')[1] as HTMLElement
    const tabs_header_el = document.querySelectorAll('div[class^="Tabs--header"] [class^="Tabs--title"]')[1] as HTMLElement
    tabs_header_el.click()
    review_with_pic_orvid.click()


    //mutObserverManager.config = { mode: 'addedNode', mutTargetChildName: 'Comment--root', domLoadedSourceParentNode: commentTabToObserve, subtree: true }
    //mutObserverManager.startObserver(onImageSrcUpdate)

    function onImageSrcUpdate() {
        const comment_album_els = review_tab_container.querySelectorAll('div[class^="Comment--album"]')

        for (const [index, comment_album_el] of Array.from(comment_album_els).entries()) {
            const comment_photos_els = comment_album_el.querySelectorAll('div[class^="Comment--photo"] img');

            for (const comment_photo_el of comment_photos_els) {
                comment_photo_el.addEventListener('load', (ev) =>
                    loadHandler(ev, comment_photo_el, index)
                );

            }
        }

        const remapped_comment_photos = []
        function loadHandler(ev, comment_photo_el, index) {
            window.scrollTo(0, document.body.scrollHeight);

            const imgAttrib = comment_photo_el.getAttribute('src');
            if (imgAttrib.includes("6000000001437-2-tps-2-2.png")) return;
            console.log(imgAttrib, ev)

            remapped_comment_photos.push({
                src: `https:${imgAttrib}`,
                key: index,
            });

            flat_comment_photos = remapped_comment_photos.flat();
        };

        flat_comment_photos = remapped_comment_photos.flat();
        //    console.log('Flat Comment Photos:', flat_comment_photos);
    }

}
