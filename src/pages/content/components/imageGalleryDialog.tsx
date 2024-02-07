import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { forwardRef } from 'react';
type ImageGalleryDialogProps = {};

const ImageGalleryDialog = forwardRef<HTMLElement, ImageGalleryDialogProps>((props, forwardedRef) => {

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="text-violet11 inline-flex float-end shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-green-500 px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none">
                    Open Image Gallery
                </button>
            </Dialog.Trigger>
            <Dialog.Portal ref={forwardedRef}>
                <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
                <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                    <Dialog.Title className="text-mauve12 m-0 text-[17px] font-medium">
                        Image Gallery
                    </Dialog.Title>
                    <div className="grid grid-cols-8 gap-4 mt-4">
                        {/* First Row */}
                        <div className="col-span-8 flex items-center justify-center">
                            <img
                                src="https://placekitten.com/200/200"
                                alt="Image 1"
                                className="w-full h-[100px] object-cover rounded-md mr-2"
                            />
                            <p className="text-sm">Description for Image 1</p>
                        </div>
                        {/* Second Row */}
                        <div className="col-span-8 flex items-center justify-center">
                            <img
                                src="https://placekitten.com/201/201"
                                alt="Image 2"
                                className="w-full h-[100px] object-cover rounded-md mr-2"
                            />
                            <p className="text-sm">Description for Image 2s</p>
                        </div>
                        {/* Add more rows as needed */}
                    </div>
                    <div className="mt-[25px] flex justify-end">
                        <Dialog.Close asChild>
                            <button className="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none">
                                Save changes
                            </button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Close asChild>
                        <button
                            className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                            aria-label="Close"
                        >
                            <Cross2Icon />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
})

export default ImageGalleryDialog;
