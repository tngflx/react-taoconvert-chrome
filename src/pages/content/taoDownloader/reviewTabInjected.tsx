import React, { useEffect, useState, useReducer } from "react"
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
        ?.map(review => {
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

// Action Types
const TOGGLE_SELECTION = "TOGGLE_SELECTION";
const CLEAR_SELECTION = "CLEAR_SELECTION";

// Reducer function
const selectionReducer = (state, action) => {
    switch (action.type) {
        case TOGGLE_SELECTION:
            const isSelected = state.includes(action.payload);
            return isSelected
                ? state.filter((src) => src !== action.payload)
                : [...state, action.payload];
        case CLEAR_SELECTION:
            return [];
        default:
            return state;
    }
};

export const ImageTiles = () => {
    const data = useStorage(dataStore);
    const [selectedImages, dispatch] = useReducer(selectionReducer, []);

    const handleImageClick = (imageSrc) => {
        dispatch({ type: TOGGLE_SELECTION, payload: imageSrc });
    };

    const handleClearSelection = () => {
        dispatch({ type: CLEAR_SELECTION });
    };

    return (
        <div className="grid grid-cols-8 gap-4 mt-4">
            {data.remappedReviewData.map(({ revPicPathList, skuText }: { revPicPathList: string[], skuText: string }, parentIndex: number) => (
                <div key={parentIndex} className="col-span-2 flex flex-col items-center justify-center">
                    <div className="grid grid-cols-2 gap-3">
                        {revPicPathList.map((link, childIndex) => (
                            <React.Fragment key={childIndex}>
                                <div className="relative">
                                    <img
                                        src={convertImageUrl(link, 450, 90)}
                                        alt={`Image ${parentIndex + 1}.${childIndex + 1}`}
                                        className="w-full h-[200px] object-cover rounded-md mb-2 hover:scale-120 transition-transform duration-300 cursor-pointer"
                                        onClick={() => handleImageClick(link)}
                                    />
                                    {selectedImages.includes(link) && (
                                        <div className="absolute top-0 left-0 p-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                className="h-6 w-6 text-green-500"
                                                onClick={() => handleImageClick(link)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="text-sm mt-2 text-center">skuText</p>
                </div>
            ))}
            {selectedImages.length > 0 && (
                <div className="col-span-8 mt-4">
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={handleClearSelection}
                    >
                        Clear Selection
                    </button>
                </div>
            )}
        </div>
    );
};

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
