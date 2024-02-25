import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { forwardRef, useState, useEffect } from 'react';
import RadixRenderer from './renderer/radixUIRenderer';
import { ImageTiles } from '../taoDownloader/reviewTabInjected';
import useStorage from '../../../shared/hooks/useStorage';
import { loadState } from '../../../shared/storages/reviewItemSkuBase';

type ImageGalleryDialogProps = {};

const ImageGalleryDialogTemplate = ({ shadowRootModal }) => {
    const [container, setContainer] = useState(null);
    let isLoading = useStorage(loadState)

    console.log(isLoading)

    return (
        <>
            <Dialog.Root>
                <Dialog.Trigger asChild disabled={isLoading}>
                    <button className="text-violet11 inline-flex float-end shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-green-500 px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none">
                        {isLoading ? (
                            <div className="flex items-center">
                                <div className="spinner-border text-white h-5 w-5 mr-2" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                                <span>Loading...</span>
                            </div>
                        ) : (
                            "Open Image Gallery"
                        )}
                    </button>
                </Dialog.Trigger>
                <Dialog.Portal container={container}>
                    {/*<Dialog.Overlay className="fixed overflow-auto inset-0 z-50 bg-blackA6 data-[state=open]:animate-in place-items-center h-full">*/}
                    <Dialog.Content
                        className="flex data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] min-h-[70vh] max-h-[90vh] min-w-[50vw] max-w-[70vw] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                        <div className="flex-auto overflow-auto p-[15px]">
                            <Dialog.Title className="text-mauve12 m-0 text-[17px] font-large">
                                Reviews Image Gallery
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button
                                    className="absolute flex text-black hover:bg-emerald-600 focus:shadow-violet7 top-[10px] right-[10px] h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                                    aria-label="Close"
                                >
                                    <Cross2Icon />
                                </button>
                            </Dialog.Close>
                            <ImageTiles />
                        </div>
                    </Dialog.Content>
                    {/*</Dialog.Overlay>*/}
                </Dialog.Portal>
            </Dialog.Root >
            <RadixRenderer shadowRootContainer={shadowRootModal} ref={setContainer} />
        </>
    )
}

const ImageGalleryDialog = ({ shadowRootButton, shadowRootModal }) => {

    return (
        <>
            <RadixRenderer shadowRootContainer={shadowRootButton}>
                <ImageGalleryDialogTemplate shadowRootModal={shadowRootModal} />
            </RadixRenderer>
        </>
    );
};


export default ImageGalleryDialog;
