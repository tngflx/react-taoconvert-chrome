import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    HamburgerMenuIcon,
    DotFilledIcon,
    CheckIcon,
    ChevronRightIcon,
} from '@radix-ui/react-icons';

const DropDownImageDownload = () => {

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="rounded-full w-[125px] h-[40px] flex float-right mr-11 items-center justify-center bg-violet5 text-violet11 text-xs font-medium shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px]"
                    aria-label="Customise options"
                >
                    TaoDownload Images
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                className="min-w-[220px] bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                sideOffset={5}
            >
                <DropdownMenu.Item
                    className="group text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
                    disabled
                >
                    Select which image to download
                    <div className="ml-auto pl-[20px] text-mauve11 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8">
                        ⇧+⌘+N
                    </div>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-[1px] bg-violet6 m-[5px]" />
                <DropdownMenu.Item className="group text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                    New Tab{' '}
                    <div className="ml-auto pl-[20px] text-mauve11 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8">
                        ⌘+T
                    </div>
                </DropdownMenu.Item>


                <DropdownMenu.Arrow className="fill-white" />
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
};

export default DropDownImageDownload;