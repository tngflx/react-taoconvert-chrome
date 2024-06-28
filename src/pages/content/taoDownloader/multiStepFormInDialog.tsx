import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { forwardRef, useState, useEffect } from 'react';
import { ImageTiles } from '../taoDownloader/reviewTabInjected';
import SelectSkuFirstStep from './components/selectSkuMultiStep';
import RadixRenderer from '../sharedComponents/renderer/radixUIRenderer';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import dataStore from '@root/src/shared/storages/dataStore';

const _multiStepFormInDialog = ({ shadowRootModal }) => {
    const [container, setContainer] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    const getStepComponent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <SelectSkuFirstStep
                        onSelectSkuText={(selected) => {
                            //setSelectedSkuTexts(selected);
                            setCurrentStep(1);
                        }}
                    />
                );
            case 1:
                return <ImageTiles />;
            // Add more cases for additional steps
            default:
                return null; // Handle unexpected step values
        }
    }
    const isLoading = dataStore.getLoadState();

    return (
        <>
            <Dialog.Root>
                <Dialog.Trigger asChild disabled={false}>
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
                    <div className="fixed inset-0 z-1 bg-blackA6" />
                    <Dialog.Content
                        className="flex data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                        <ScrollArea.Root className="overflow-hidden p-[15px]">
                            <ScrollArea.Viewport className="min-h-[70vh] max-h-[90vh] min-w-[50vw] max-w-[70vw] rounded">
                                <Dialog.Title className="text-mauve12 m-0 text-[17px] font-large">
                                    Reviews Image Gallery
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button
                                        className="absolute flex text-black hover:bg-emerald-600 focus:shadow-violet7 top-[10px] right-[20px] h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                                        aria-label="Close"
                                    >
                                        <Cross2Icon />
                                    </button>
                                </Dialog.Close>
                                {getStepComponent()}
                            </ScrollArea.Viewport>
                            <ScrollArea.Scrollbar
                                className="flex select-none touch-none p-0.5 bg-blackA3 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                                orientation="vertical"
                            >
                                <ScrollArea.Thumb className="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                            </ScrollArea.Scrollbar>
                            <ScrollArea.Corner className="bg-blackA5" />
                        </ScrollArea.Root>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root >
            <RadixRenderer shadowRootContainer={shadowRootModal} ref={setContainer} />
        </>
    )
}

const MultiStepFormInDialog = ({ shadowRootButton, shadowRootModal }) => {

    return (
        <>
            <RadixRenderer shadowRootContainer={shadowRootButton}>
                <_multiStepFormInDialog shadowRootModal={shadowRootModal} />
            </RadixRenderer>
        </>
    );
};


export default MultiStepFormInDialog;
