"use client";

import { useState } from "react";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true); // 切換登入/註冊模式
    const [message, setMessage] = useState("");

    const handleSubmit = async () => {
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setMessage("登入成功！");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                setMessage("註冊成功！歡迎加入 MatchU！");
            }
        } catch (err: any) {
            setMessage(`操作失敗：${err.message}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <Navbar />
            <main className="
                p-8 w-[350px] max-w-full 
                mx-auto mt-[80px] border border-gray-300 rounded shadow-lg"
                >
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">
                    {isLogin ? "登入 MatchU" : "註冊 MatchU"}
                </h1>

                <input
                    className="block w-full border border-gray-400 rounded p-2 mb-4"
                    type="email"
                    placeholder="電子信箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                />

                <input 
                    className="block w-full border border-gray-400 rounded p-2 mb-4"
                    type="password"
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 transition cursor-pointer"
                >
                    {isLogin ? "登入" : "註冊"}
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">{message}</p>

                <p className="mt-6 text-center text-md text-gray-500">
                    {isLogin ? "還沒有帳號？" : "已經有帳號？"}
                    <button 
                        className="text-purple-600 font-semibold ml-1 cursor-pointer"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "註冊" : "登入"}
                    </button>
                </p>
            </main>
            <Footer />
        </div>
    );
}