import { MemoryRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { navLinks } from "./component/navLinks";
import { Home } from "./tabs/Home";
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';

import { Outlet } from "react-router-dom";
import { AutoUploadTopup } from "./tabs/autoUploadTopup";
import { ListsDownload } from "./tabs/listsDownload";
import { ImportedProducts } from "./tabs/importedProducts";

const CompanyLogo = () => {
    return (
        <Link to="/" className="flex items-center">
            <span className="self-center text-xl font-bold text-gray-800 whitespace-nowrap dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                My Company
            </span>
        </Link>
    );
};

const MenuLinks = ({ menuLinks }) => {
    return (
        <ul className="flex px-1 lg:px-4">
            {menuLinks.map((link) => (
                <div className="relative group" key={link.name}>
                    <li className={`p-2 font-semibold rounded-lg cursor-pointer lg:px-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 ${location.pathname === link.route ? 'active' : ''}`}>
                        <Link to={link.route}>{link.name}</Link>
                    </li>
                </div>
            ))}
        </ul>
    )
};

const Navbar = () => {

    return (
        <>
            <nav className="flex items-center h-16 px-3 m-0 md:px-4 dark:bg-gray-900 bg-gray-50">
                <div className="flex items-center justify-between w-full md:mx-4 lg:mx-8 2xl:w-[80em] 2xl:mx-auto">
                    <div className="flex items-center justify-center">
                        <div className="md:block">
                            <CompanyLogo />
                        </div>
                        <div className="relative ml-4 text-gray-600 top-[1px] md:block">
                            <MenuLinks menuLinks={navLinks} />
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};


const Container = () => {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
};

const Popup = () => {
    return (
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<Container />}>
                    <Route index element={<Home />} />
                    <Route path="/importedProducts" element={<ImportedProducts />} />
                    <Route path="/autoUploadTopup" element={<AutoUploadTopup />} />
                    <Route path="/listsDownload" element={<ListsDownload />} />
                </Route>
            </Routes>
        </MemoryRouter>
    )
}

export default Popup;