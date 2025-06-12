// app/chat/[matchId]/page.tsx 配對聊天室
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
	getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/components/Navbar";
import { useHasMatch } from "@/hooks/useHasMatch";
import { formatDateHeader } from "@/utils/formatDateHeader";
import { Timestamp } from "firebase/firestore";
import { CameraIcon } from "@heroicons/react/24/solid";
import { uploadImage} from "@/lib/uploadImage";

type Message = {
	sender: string;
	content?: string;  // 文字改為可選，讓使用者可以只傳圖片
	imageUrl?: string;
	createdAt: Timestamp;
}

export default function ChatRoomPage() {
  const { matchId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const hasMatch = useHasMatch();
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const [partner, setPartner] = useState<{ name: string; avatarUrl: string; uid: string} | null>(null);
	const [enlargedImage, setEnlargedImage] = useState<string | null>(null);


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
							const avatarUrls = otherUserData.avatarUrls;
							const avatarUrl = Array.isArray(avatarUrls) && avatarUrls.length > 0
								? avatarUrls[0]
								: "/default-avatar.png";
							setPartner({
								uid: otherUid,
								name: otherUserData.name || "匿名",
								avatarUrl,
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

		let latestTimestamp = 0;

		// 初次進聊天室，先撈出全部訊息一次
		getDocs(q).then((snapshot) => {
			const initialMessages = snapshot.docs.map((doc) => doc.data() as Message);
			setMessages(initialMessages);

			const last = snapshot.docs[snapshot.docs.length - 1]?.data()?.createdAt?.toMillis?.();
			if (last) latestTimestamp = last;

			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		});

		// 設置增量監聽器，只監聽新增訊息

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
				const matchRef = doc(db, "matches", matchId as string);

				if (change.type === "added") {
					const newMsg = change.doc.data() as Message;
					const newTimestamp = newMsg.createdAt?.toMillis?.() || 0;

					if (newTimestamp > latestTimestamp) {
						setMessages((prev) => [...prev, newMsg]);
						setTimeout(() => {
							messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
						}, 100);
					}
				}

				if (change.type === "removed") {
					const docs = snapshot.docs;
					if (docs.length === 0) {
						await updateDoc(matchRef, {
							lastMessage: "",
							lastUpdated: null,
						});
						setMessages([]);
					} else {
						const latestDoc = docs[docs.length - 1];
						const lastMessage = latestDoc.data() as Message;

						await updateDoc(matchRef, {
							lastMessage: lastMessage.content,
							lastUpdated: lastMessage.createdAt,
						});

						const msgs = docs.map((doc) => doc.data() as Message);
						setMessages(msgs);
					}
				}
			});
    });

    return () => unsubscribe();
  }, [matchId]);

// 輸入訊息自動滾動到底部
useEffect(() => {
  if (messages.length === 0) return;
  
  const timeout = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100); // 加個微延遲，避免圖片或文字未載入完就滾動失敗

  return () => clearTimeout(timeout);
}, [messages]);

// 按Esc關閉圖片
useEffect(()=> {
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			setEnlargedImage(null);
		}
	};

	if (enlargedImage) {
		document.addEventListener("keydown", handleKeyDown);
	}

	return () => {
		document.removeEventListener("keydown", handleKeyDown);
	};
}, [enlargedImage]);


  const sendMessage = async () => {
    if (!input.trim() || !currentUserId) return;

		const matchRef = doc(db, "matches", matchId as string);

		// 預先顯示訊息在畫面（Optimistic UI）
		const tempMessage: Message = {
			sender: currentUserId,
			content: input.trim(),
			createdAt: Timestamp.now(), // 使用本地時間先顯示
		};
		setMessages((prev) => [...prev, tempMessage]);
		
		// 清空輸入框
  	setInput("");

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

	async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file || !currentUserId) return;

		const imageUrl = await uploadImage(file, currentUserId);
		console.log("上傳成功 imageUrl：", imageUrl);

		// 預先在畫面顯示圖片訊息（optimistic UI）
		setMessages((prev) => [
			...prev,
			{
				sender: currentUserId,
				imageUrl,
				createdAt: Timestamp.now(), // 本地時間先顯示
			},
		]);		
		
		const matchRef = doc(db, "matches", matchId as string);
		const matchSnap = await getDoc(matchRef);
		const matchData = matchSnap.data();
		const otherUid = matchData?.userIds.find((id: string) => id !== currentUserId);

		await addDoc(collection(matchRef, "messages"), {
			sender: currentUserId,
			imageUrl,
			createdAt: serverTimestamp(),
		});

		await updateDoc(matchRef, {
			lastMessage: "[圖片]",
			lastUpdated: serverTimestamp(),
			[`unreadCounts.${otherUid}`]: (matchData?.unreadCounts?.[otherUid] || 0) + 1
		});

	}

	function linkify(text: string) {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.split(urlRegex).map((part, index) => {
			if (part.match(urlRegex)) {
				return (
					<a
						key={index}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 underline hover:text-blue-700"
					>
						{part}
					</a>
				);
			}
			return part;
		});
	}

  return (
		<div className="bg-[url('/chat-bg.jpg')] bg-cover bg-repeat">
			<div className="min-h-screen flex flex-col p-4 mt-[80px] max-w-md mx-auto">
				<Navbar partner={partner} />

				<div className="flex-1 overflow-hidden space-y-3 border p-3 rounded bg-white shadow border-gray-300 border-1 bg-white/90">
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
												isMe ? `${msg.imageUrl ? "" : "bg-purple-100"} text-left`
												: `${msg.imageUrl ? "" : "bg-purple-100"} text-left`
											}`}
										>
											{msg.imageUrl ? (
												<img 
													src={msg.imageUrl} 
													alt="圖片訊息" 
													className="max-w-[180px] rounded cursor-pointer"
													onClick={() => setEnlargedImage(msg.imageUrl!)}
												/>
											) : (
												<span>{msg.content && linkify(msg.content)}</span>
											)}
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
				
				<div className="flex overflow-hidden sticky bottom-0">
					<input 
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						className="flex-1 min-w-0 border p-2 rounded-l-md border-gray-300"
						placeholder="輸入訊息..."
					/>

					<label 
						className="bg-purple-400 hover:bg-purple-300 text-white cursor-pointer flex items-center px-3"
						title="上傳圖片"
					>
						<CameraIcon className="w-5 h-5 text-white" />
						<input
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</label>

					<button
						onClick={sendMessage}
						className="bg-purple-500 text-white px-3 rounded-r-md cursor-pointer hover:bg-purple-600"
					>
						傳送
					</button>
				</div>
			</div>
			{enlargedImage && (
				<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
					<button
						className="absolute top-4 right-4 text-white text-4xl cursor-pointer"
						onClick={() => setEnlargedImage(null)}
						aria-label="關閉圖片"
					>
						&times;
					</button>
					<img
						src={enlargedImage}
						alt="放大圖片"
						className="max-w-[90%] max-h-[90%] rounded shadow-lg"
					/>
				</div>
			)}
		</div>
  );
}