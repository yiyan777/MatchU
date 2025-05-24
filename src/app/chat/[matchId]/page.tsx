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
	updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/components/Navbar";
import { useHasMatch } from "@/hooks/useHasMatch";
import { formatDateHeader } from "@/utils/formatDateHeader";

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
		if (!matchId || !currentUserId) return;

		const matchRef = doc(db, "matches", matchId as string);

		// 將自己的 unreadCounts 歸零
		updateDoc(matchRef, {
			[`unreadCounts.${currentUserId}`]: 0
		}).catch((err) => console.error("Failed to reset unread count:", err));
	}, [matchId, currentUserId]);

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

		const matchRef = doc(db, "matches", matchId as string);

		// 取得 match 資料 ，以找出對方 UID
		const matchSnap = await getDoc(matchRef);
		const matchData = matchSnap.data();
		const otherUid = matchData?.userIds.find((id: string) => id !== currentUserId);



		// 寫入新訊息到 messages 子集合
    await addDoc(collection(matchRef, "messages"), {
      sender: currentUserId,
      content: input.trim(),
      createdAt: serverTimestamp(),
    });

		// 更新 LastMessage、LastUpdated 以及 對方的 unreadCounts
		await updateDoc(matchRef, {
			lastMessage: input.trim(),
			lastUpdated: serverTimestamp(),
			[`unreadCounts.${otherUid}`]: (matchData?.unreadCounts?.[otherUid] || 0) + 1
		});

    setInput(""); //清空輸入框
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

      <div className="flex-1 overflow-y-auto space-y-3 border p-3 rounded bg-white shadow border-gray-300 border-1">
        {messages.map((msg, index) => {
					const isMe = msg.sender === currentUserId;
					const dateObj = msg.createdAt?.toDate?.();
					const dateStr = dateObj ? formatDateHeader(dateObj) : "";

					const time = msg.createdAt?.toDate?.().toLocaleTimeString("zh-TW", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					}) || "";

					// 判斷是否顯示日期分隔
					const prevMsg = messages[index - 1];
					const prevDateStr = prevMsg?.createdAt?.toDate?.() ? formatDateHeader(prevMsg.createdAt.toDate()) : "";

					const showDateHeader = index === 0 || dateStr !== prevDateStr;

					return(
						<div key={index}>
							{showDateHeader && (
								<div className="text-center text-sm text-gray-500 my-3">
									{dateStr}
								</div>
							)}						
							<div className={`flex items-end ${isMe ? "justify-end" : "justify-start"}`}>
								<div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
									{!isMe && partner && (
										<img 
											src={partner.avatarUrl} 
											alt="對方頭像" 
											className="w-8 h-8 rounded-full object-cover"
										/>
									)}
									<div 
										className={`py-2 px-2 rounded-md max-w-[85%] text-sm ${
											isMe ? "bg-purple-100 text-left"
											: "bg-gray-100 text-left "
										}`}
									>
										{msg.content}
									</div>
									<span className="text-xs text-gray-500 whitespace-nowrap">
										{time}
									</span>
								</div>
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
					className="flex-1 border p-2 rounded-l-md border-gray-300"
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