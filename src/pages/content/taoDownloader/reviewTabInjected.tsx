import React, {  useReducer } from "react"
import useStorage from "../../../shared/hooks/useStorage";
import dataStore from "../../../shared/storages/reviewItemSkuBase";
import { convertImageUrl } from "../utils/imageResize";
import * as Dialog from '@radix-ui/react-dialog';

export async function processReviewTab() {
    let { href: currentURL, origin: domain, search: queryString, pathname } = window.location
    const queryParams = new URLSearchParams(queryString);

    const url_param_data = { "itemId": queryParams.get('id'), "bizCode": "ali.china.tmall", "channel": "pc_detail", "pageSize": 100, "pageNum": 1 }

    const h5api_review_data: { data: any } = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ msg_action: 'buyertrade:get_itempage_reviews', url_param_data }, h5api_data => {
            resolve(h5api_data)
        })
    })
    const { data: { module: { reviewVOList } } } = h5api_review_data;

    const remapped_review_data = reviewVOList
        ?.reduce((grouped_by_skutext_review_data, review) => {
            const { reviewAppendVO } = review;
            // Flatten 
            const revPicPathList = [...(review.reviewPicPathList || []), ...(reviewAppendVO?.reviewPicPathList || [])];
            if (revPicPathList?.length == 0) return grouped_by_skutext_review_data;

            const skuValue = review?.skuText?.['颜色分类'];

            // const { appendedWordContent } = reviewAppendVO;
            let existing_entry = grouped_by_skutext_review_data.get(skuValue)

            if (!existing_entry) {
                existing_entry = {
                    skuText: {
                        ...review.skuText,
                        category: skuValue
                    },
                    review_data: []
                }
                grouped_by_skutext_review_data.set(skuValue, existing_entry);
            }
            delete existing_entry.skuText['颜色分类'];

            existing_entry.review_data.push({
                revPicPathList,
                reviewDate: review.reviewDate,
                reviewWordContent: review.reviewWordContent
            })

            return grouped_by_skutext_review_data;
        }, new Map())

    return Array.from(remapped_review_data.values())
}

const selectionReducer = (state, action) => {
    switch (action.type) {
        case "TOGGLE_SELECTION": {
            const isSelected = state.includes(action.payload);
            return isSelected
                ? state.filter((src) => src !== action.payload)
                : [...state, action.payload];
        }
        case "CLEAR_SELECTION":
            return [];
        default:
            return state;
    }
};


export const ImageTiles = () => {
    const data = useStorage(dataStore);
    const [selectedImages, dispatch] = useReducer(selectionReducer, []);

    const handleImageClick = (imageSrc) => {
        dispatch({ type: "TOGGLE_SELECTION", payload: imageSrc });
    };

    const handleClearSelection = () => {
        dispatch({ type: "CLEAR_SELECTION" });
    };

    const handleCollectAllSelections = () => {
        const imageSelections = selectedImages.slice(); // Create a copy of selectedImages
        const result = [];

        data.remappedReviewData.forEach(({ skuText, review_data }) => {
            const selectedImagesForSku = review_data
                .flatMap(({ revPicPathList }) =>
                    revPicPathList.filter((imagePath) =>
                        imageSelections.includes(imagePath)
                    )
                );

            if (selectedImagesForSku.length > 0) {
                result.push({ skuText, selectedImages: selectedImagesForSku });
            }
        });

        console.log(result)
    };

    if (!data || !data.remappedReviewData) {
        return null;
    }

    return (
        <>
            <div className="flex flex-wrap gap-4 mb-12">
                {data.remappedReviewData.map(({ review_data, skuText: { category } }, parentIndex: number) => (
                    <div key={parentIndex} className="w-full lg:w-2/10 mx-auto">
                        <p className="text-[15px] mb-4 text-left ">{category}</p>
                        {review_data.map(({ revPicPathList }: { revPicPathList: [] }, childIndex) => (
                            <div key={childIndex} className="grid grid-cols-8 gap-3">
                                {revPicPathList.map((imagePath, imageIndex) => (
                                    <div className="relative" key={imageIndex}>
                                        <img
                                            src={convertImageUrl(imagePath, 450, 90)}
                                            alt={`${parentIndex + 1}.${childIndex + 1}`}
                                            className="w-full h-[200px] object-cover rounded-lg mb-2 hover:scale-125 transition-transform duration-300 cursor-pointer"
                                            onClick={() => handleImageClick(imagePath)}
                                        />
                                        {selectedImages.includes(imagePath) && (
                                            <div className="absolute top-0 left-0 p-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    className="h-6 w-6 text-green-500"
                                                    onClick={() => handleImageClick(imagePath)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="fixed flex flex-row gap-4 inset-x-0 bottom-0 bg-gray-700 p-2 w-full justify-end">
                {selectedImages.length > 0 && (
                    <button
                        className="bg-green-500 text-white px-[15px] h-[35px] rounded"
                        onClick={handleClearSelection}
                    >
                        Clear Selection
                    </button>
                )}
                <Dialog.Close asChild>
                    <button
                        onClick={handleCollectAllSelections}
                        className="bg-green5 text-green11 hover:bg-green6 focus:shadow-green7 h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
                    >
                        Next Step
                    </button>
                </Dialog.Close>
            </div>
        </>
    );
};

let flat_comment_photos;
function reviewTabScrape() {
    const commentTabToObserve = 'div[class^="Tabs--root"] [class^="Tabs--container"]';

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
