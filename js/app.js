var app = {
	
	// netty后端服务器
	nettyServerUrl: 'ws://192.168.1.106:8080/ws',
	// nettyServerUrl: 'ws://121.41.84.238:8080/ws',
	
	// 后端地址
	serverUrl: 'http://192.168.1.106:8088',
	// serverUrl: 'http://121.41.84.238:8088',
	
	// 图片服务器nginx地址
	imageServerUrl: 'http://121.41.84.238:8888/group1/',
	
	/**
	 * 判断变量是否为空
	 * @param {Object} str
	 */
	isNotNull: function(str){
		if(str != null && str != "" && str != undefined){
			return true;
		}
		return false;
	},
	
	
	/**
	 * 弹窗
	 * @param {Object} type: 弹窗图片类型
	 * @param {Object} msg: 弹窗信息
	 */
	showToast: function(msg, type){
		plus.nativeUI.toast(msg, 
			{icon:"image/" + type + ".png", verticalAlign:"center"});
	},
	
	/**
	 * 将用户数据保存在客户端
	 * @param {Object} user
	 */
	setUserGlobalInfo: function(user) {
		// 将json数据转换为字符串，并将数据保存在手机里
		var userInfoStr = JSON.stringify(user);
		plus.storage.setItem("userInfo", userInfoStr);
	},
	
	/**
	 * 从客户端中获取全局信息
	 */
	getUserGlobalInfo: function() {
		var userInfoStr = plus.storage.getItem("userInfo");
		return JSON.parse(userInfoStr);
	},
	
	/**
	 * 用户退出
	 */
	userLogout: function() {
		// 清空手机里用户信息全局缓存
		plus.storage.removeItem("userInfo");
	},
	
	/**
	 * 保存联系人列表到手机内存
	 */
	setContactList: function(contactList) {
		var contactListStr = JSON.stringify(contactList);
		plus.storage.setItem("contactList", contactListStr);
	},
	
	/**
	 * 获取联系人列表
	 */
	getContactList: function() {
		var contactListStr = plus.storage.getItem("contactList");
		if(!this.isNotNull(contactListStr)){
			return [];
		}
		return JSON.parse(contactListStr);
	},
	
	/**
	 * 聊天信息对象，与后端保持一致
	 */
	ChatMessage: function(senderId, recieverId, message, messageId){
		this.senderId = senderId;
		this.recieverId = recieverId;
		this.message = message;
		this.messageId = messageId;
	},
	
	/**
	 * 消息发送对象，与后端保持一致
	 */
	DataContent: function(action, chatMessage, extend){
		this.action = action;
		this.chatMessage = chatMessage;
		this.extend = extend;
	},
	
	/**
	 * 定义发送消息类型，与后端保持一致
	 */
	CONNECT: 1,		// 客户端链接服务端消息
	CHAT: 2,		// 客户端发送的聊天消息
	SIGNED: 3,		// 消息签收
	KEEPALIVE: 4,   // 客户端保持心跳
	PULL_FRIEND: 5, // 重新拉取好友
	
	ME_FLAG: 1,   	// 1表示消息是我发送的
	FRIEND_FLAG: 2, // 2表示消息是朋友发送的
	
	/**
	 * 构建历史聊天记录
	 * flag: 1表示消息是我发送的，2表示朋友
	 */
	ChatHistory: function(myId, friendId, message, flag){
		this.myId = myId;
		this.friendId = friendId;
		this.message = message;
		this.flag = flag;
	},
	
	/**
	 * 将聊天信息保存在本地缓存中
	 * flag: 1表示消息是我发送的，2表示朋友
	 */
	saveUserChatHistory: function(myId, friendId, message, flag){
		var chatKey = "chat-" + myId + "-" + friendId;
		// 从本地缓存中获取chatKey,查看聊天记录是否存在
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		var chatHistoryList;
		if(this.isNotNull(chatHistoryListStr)){
			// 如果历史聊天记录不为空, 存入chatHistoryList中
			chatHistoryList = JSON.parse(chatHistoryListStr);
		}else{
			// 如果历史聊天记录为空, 直接赋空list
			chatHistoryList = [];
		}
		
		// new 聊天记录对象
		var singleChatMessage = new this.ChatHistory(myId, friendId, message, flag);
		// 将聊天记录添加至chatHistoryList中
		chatHistoryList.push(singleChatMessage);
		
		// 保存的键值对，值一定要转换为字符串，直接使用json保存不到缓存中去
		plus.storage.setItem(chatKey, JSON.stringify(chatHistoryList));
		
		
	},
	
	/**
	 * 获取用户聊天记录
	 */
	getUserChatHistory: function(myId, friendId){
		
		var chatKey = "chat-" + myId + "-" + friendId;
		// 从本地缓存中获取chatKey,查看聊天记录是否存在
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		var chatHistoryList;
		if(this.isNotNull(chatHistoryListStr)){
			// 如果历史聊天记录不为空, 存入chatHistoryList中
			chatHistoryList = JSON.parse(chatHistoryListStr);
		}else{
			// 如果历史聊天记录为空, 直接赋空list
			chatHistoryList = [];
		}
		return chatHistoryList;
	},
	
	/**
	 * 删除用户聊天记录
	 */
	deleteUserChatHistory: function(myId, friendId){
		var chatKey = "chat-" + myId + "-" + friendId;
		plus.storage.removeItem(chatKey);
	},
	
	/**
	 * 聊天快照对象
	 */
	ChatSnapshot: function(myId, friendId, message, isRead){
		this.myId = myId;
		this.friendId = friendId;
		this.message = message;
		this.isRead = isRead;
	},
	
	/**
	 * 将聊天快照保存在本地缓存中,仅仅保存与朋友聊天的最后一条信息
	 */
	saveUserChatSnapshot: function(myId, friendId, message, isRead){
		var chatKey = "chat-snapshot-" + myId;
		// 从本地缓存中获取chatKey,查看聊天记录是否存在
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(this.isNotNull(chatSnapshotListStr)){
			var chatSnapshotList = JSON.parse(chatSnapshotListStr);
			// 如果聊天快照不为空，判断聊天快照中是否包含该friendId的聊天信息,如果包含该快照则删除，然后存储新的
			for(var i = 0; i < chatSnapshotList.length; i++){
				if(chatSnapshotList[i].friendId == friendId){
					// 删除已经存在的friendId的聊天快照
					chatSnapshotList.splice(i, 1);
					break;
				}
			}
			
		}else{
			// 如果历史聊天记录为空, 直接赋空list
			chatSnapshotList = [];
		}
		
		// new 聊天快照对象
		var singleChatSnapshot = new this.ChatSnapshot(myId, friendId, message, isRead);
		
		// 将聊天快照添加至chatSnapshotList中的最前面
		chatSnapshotList.unshift(singleChatSnapshot);
		
		// 保存的键值对，值一定要转换为字符串，直接使用json保存不到缓存中去
		plus.storage.setItem(chatKey, JSON.stringify(chatSnapshotList));
		
	},
	
	/**
	 * 获取用户聊天快照
	 */
	getUserChatSnapshot: function(myId){
		
		var chatKey = "chat-snapshot-" + myId;
		// 从本地缓存中获取chatKey,查看聊天记录是否存在
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(this.isNotNull(chatSnapshotListStr)){
			// 如果历史聊天记录不为空, 存入chatSnapshotList中
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
		}else{
			// 如果历史聊天记录为空, 直接赋空list
			chatSnapshotList = [];
		}
		return chatSnapshotList;
	},
	
	/**
	 * 删除用户聊天快照
	 */
	deleteUserChatSnapshot: function(myId, friendId){
		var chatKey = "chat-snapshot-" + myId;
		
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(this.isNotNull(chatSnapshotListStr)){
			var chatSnapshotList = JSON.parse(chatSnapshotListStr);
			// 如果聊天快照不为空，判断聊天快照中是否包含该friendId的聊天信息,如果包含该快照则删除，然后存储新的
			for(var i = 0; i < chatSnapshotList.length; i++){
				if(chatSnapshotList[i].friendId == friendId){
					// 删除已经存在的friendId的聊天快照
					chatSnapshotList.splice(i, 1);
					break;
				}
			}
			
		}else{
			// 如果历史聊天记录为空, 直接赋空list
			chatSnapshotList = [];
		}
		
		plus.storage.setItem(chatKey, JSON.stringify(chatSnapshotList));
	},
	
	/**
	 * @param 根据用户id从本地缓存中获取好友信息
	 */
	getFriendInfoFromContractList: function(friendId){
		var contactListStr = plus.storage.getItem("contactList");
		
		if(this.isNotNull(contactListStr)){
			var contactList = JSON.parse(contactListStr);
			for(var i = 0; i < contactList.length; i++){
				var friend = contactList[i];
				if(friend.friendUserId == friendId){
					return friend;
				}
			}
		}else{
			return null;
		}
	},
	
	/**
	 * 将isRead设置为已读状态
	 */
	setReadChatSnapshot: function(myId, friendUserId){
		var chatKey = "chat-snapshot-" + myId;
		// 从本地缓存中获取chatKey,查看聊天记录是否存在
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(this.isNotNull(chatSnapshotListStr)){
			var chatSnapshotList = JSON.parse(chatSnapshotListStr);
			// 如果聊天快照不为空，判断聊天快照中是否包含该friendId的聊天信息,如果包含该快照则删除，然后存储新的
			for(var i = 0; i < chatSnapshotList.length; i++){
				var chatSnapshot = chatSnapshotList[i];
				if(chatSnapshot.friendId == friendUserId){
					// 将消息置为已读
					chatSnapshot.isRead = true;
					chatSnapshotList.splice(i, 1, chatSnapshot); // 用更新后的快照更换原来的快照
					break;
				}
			}
			plus.storage.setItem(chatKey, JSON.stringify(chatSnapshotList));
		}else{
			// 如果历史聊天记录为空
			return;
		}
	},
	
}