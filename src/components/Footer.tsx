"use client";

import { usePathname } from "next/navigation";

export default function Footer({ className = "" }) {
    const pathname = usePathname();
    const isProfilePage = pathname === "/profile";
    
    return (
        <footer 
            className={`
            flex justify-center items-center py-10
            font-medium mt-10 h-auto border-t border-gray-300 
            text-gray-600 text-lg bottom-0 right-0 left-0 ${className}
            ${isProfilePage ? "mt-[200px]" : ""}
            `}
        >
            <div className="m-auto">
                © 2025 MatchU.&nbsp;All rights reserved.
            </div>
            
        </footer>
    );
}


