// app/chat/[matchId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/components/Navbar";
import { useHasMatch } from "@/hooks/useHasMatch";

export default function ChatRoomPage() {
  const { matchId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const hasMatch = useHasMatch();
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const [partner, setPartner] = useState<{ name: string; avatarUrl: string} | null>(null);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return; 
        setCurrentUserId(user.uid);

				//取得 match 文件
				const matchRef = doc(db, "matches", matchId as string);
				const matchSnap = await getDoc(matchRef);
				const matchData = matchSnap.data();

				if (matchData) {
					const otherUid = matchData.userIds.find((id: string) => id !== user.uid);
					if (otherUid) {
						const otherUserSnap = await getDoc(doc(db, "users", otherUid));
						const otherUserData = otherUserSnap.data();
						if (otherUserData) {
							setPartner({
								name: otherUserData.name || "匿名",
								avatarUrl: otherUserData.avatarUrl || "/default-avatar.png",
							});
						}
					}
				}
    });

    return () => unsubscribeAuth();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    const q = query(
      collection(db, "matches", matchId as string, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [matchId]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId) return;

    await addDoc(collection(db, "matches", matchId as string, "messages"), {
      sender: currentUserId,
      content: input.trim(),
      createdAt: serverTimestamp(),
    });

    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col p-4 mt-[80px] max-w-md mx-auto">
			<Navbar  hasMatch={hasMatch} />

			{partner && (
				<div className="flex items-center gap-3 mb-4">
					<img 
						src={partner.avatarUrl} 
						alt="對方頭像"
						className="w-10 h-10 rounded-full object-cover"
					/>
					<div className="text-lg font-semibold">{partner.name}</div>
				</div>
			)}

      <div className="flex-1 overflow-y-auto space-y-3 border p-3 rounded bg-white shadow">
        {messages.map((msg, index) => {
					const isMe = msg.sender === currentUserId;
					return(
						<div
							key={index}
							className={`flex items-end ${isMe ? "justify-end" : "justify-start"}`}
						>
							{!isMe && partner && (
								<img 
									src={partner.avatarUrl} 
									alt="對方頭像" 
									className="w-8 h-8 rounded-full object-cover mr-2"
								/>
							)}
							<div 
								className={`p-2 rounded-md max-w-[70%] text-sm ${
									isMe ? "bg-purple-100 self-end text-right"
									: "bg-gray-100 self-start text-left"
								}`}
							>
								{msg.content}
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
      </div>
			
			<div className="flex mt-4">
				<input 
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && sendMessage()}
					className="flex-1 border p-2 rounded-l-md"
					placeholder="輸入訊息..."
				/>
				<button
					onClick={sendMessage}
					className="bg-purple-500 text-white px-4 rounded-r-md cursor-pointer"
				>
					傳送
				</button>
			</div>
    </div>
  );
}