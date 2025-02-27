import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import copy from 'copy-to-clipboard';

import { Message, imageMessage, Conversation } from './type'

import handleImageUpload from '../api/imageUploadUtils';
import { CozeAPI, ChatEventType, RoleType } from '@coze/api';
import { token, baseURL, bot_id } from '../config/initConfig';
import './ChatDialog.css';

//HTMLInputElement 是 TypeScript 中预定义的一个接口，
// 它包含了 <input> 元素的所有属性和方法。
const ChatDialog = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentConversation = conversations[currentConversationIndex];
    const messages = currentConversation ? currentConversation.messages : [];

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 处理文件上传
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles([...files, ...selectedFiles]);

    };

    // 处理消息发送
    const handleSubmit = async () => {
        if (!input.trim() && files.length === 0) return;

        // 用户消息
        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,

            isUser: true,
            files: [...files],
            imageUrls: [...imageUrls],
        };
        console.log('userMessage', userMessage)

        // AI 占位消息（流式响应）
        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '',

            isUser: false,
            isStreaming: true,
            imageUrls: [...imageUrls],
        };

        const newMessages = [...messages, userMessage, aiMessage];
        const newConversations = [...conversations];
        newConversations[currentConversationIndex] = {
            ...currentConversation,
            messages: newMessages,
        };
        setConversations(newConversations);
        // 发送后清空状态
        setInput('');
        // setImageUrls([]);
        setFiles([]);

        try {
            setIsLoading(true);


            // 初始化 Coze 客户端
            const client = new CozeAPI({
                token, // 替换为你的个人访问令牌
                baseURL,
                allowPersonalAccessTokenInBrowser: true, // 添加这一行
            });

            // 调用 Coze API 发送消息并开启流式聊天
            const stream = await client.chat.stream({
                bot_id, // 替换为你的 Bot ID
                additional_messages: [
                    {
                        role: RoleType.User,
                        content: input,
                        content_type: 'text',
                    },
                ],
            });

            // 处理实时流响应
            for await (const part of stream) {
                if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    const updatedMessages = newConversations[currentConversationIndex].messages.map((msg) =>
                        msg.id === aiMessage.id
                            ? { ...msg, content: msg.content + part.data.content, isStreaming: true }
                            : msg,

                    );
                    newConversations[currentConversationIndex] = {
                        ...newConversations[currentConversationIndex],
                        messages: updatedMessages,
                    };
                    setConversations([...newConversations]);
                }
            }

            // 完成响应后的状态更新
            // 最终得到一个更新后的消息列表，其中
            // 与aiMessage 具有相同id的消息的isStreaming属性被设置为false
            const finalMessages = newConversations[currentConversationIndex].messages.map((msg) =>
                msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
            );
            newConversations[currentConversationIndex] = {
                ...newConversations[currentConversationIndex],
                messages: finalMessages,
            };

            setConversations([...newConversations]);

        } catch (error) {
            console.error('API 错误:', error);
            const errorMessages = messages.map((msg) =>
                msg.id === aiMessage.id
                    ? { ...msg, content: '错误: 获取响应失败', isStreaming: false }
                    : msg
            );
            const newConversations = [...conversations];
            newConversations[currentConversationIndex] = {
                ...currentConversation,
                messages: errorMessages,
            };
            setConversations(newConversations);
        } finally {
            setIsLoading(false);
        }
    };



    // 复制消息内容的功能
    const handleCopyMessage = (content: string) => {
        copy(content);
        alert('信息已经复制成功!');
    };

    // 渲染代码块（带复制按钮）
    const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const codeContent = String(children).replace(/\n$/, '');

        return !inline && match ? (
            <div className="code-block-wrapper">
                <div className="code-block-header">
                    <span>{match[1]}</span>
                    <button
                        onClick={() => copy(codeContent)}
                        className="copy-button"
                    >
                        Copy
                    </button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {codeContent}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    };

    // 创建新对话
    const createNewConversation = () => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: `对话 ${conversations.length + 1}`,
            messages: [],
        };
        setConversations([...conversations, newConversation]);
        setCurrentConversationIndex(conversations.length);
    };

    // 提取图片链接显示到对话框
    const extractImageUrls = (content: string) => {
        const regex = /\[.*?\]\((https?:\/\/.*?)\)/g;
        const matches = content.match(regex);
        if (!matches) return [];
        return matches.map((match) => {
            const urlRegex = /\((https?:\/\/.*?)\)/;
            const urlMatch = match.match(urlRegex);
            return urlMatch ? urlMatch[1] : '';
        }).filter((url) => url);
    };

    return (
        <div className="app-container">
            {/* 对话列表 */}
            <div className="conversation-list">
                <button onClick={createNewConversation}>创建新对话</button>
                {conversations.map((conversation, index) => (
                    <div
                        key={conversation.id}
                        className={`conversation-item ${index === currentConversationIndex ? 'active' : ''
                            }`}
                        onClick={() => setCurrentConversationIndex(index)}
                    >
                        {conversation.title}
                    </div>
                ))}
            </div>

            {/* 聊天窗口 */}
            <div className="chat-container">
                <div className="messages-container">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.isUser ? 'user' : 'ai'}`}
                        >
                            {/* 文件预览 */}
                            {message.files?.map((file, index) => (
                                <div key={index} className="file-preview">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="preview-image"
                                        />
                                    ) : (
                                        <div className="file-info">
                                            <span>{file.name}</span>
                                            <span>{Math.round(file.size / 1024)} KB</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* 内容展示 */}
                            <div className="message-content">
                                {!message.isUser ? (
                                    <>

                                        <ReactMarkdown
                                            components={{
                                                code: CodeBlock,
                                                img: ({ node, ...props }) => (
                                                    <img {...props} style={{ maxWidth: '100%' }} />
                                                ),
                                            }}
                                        >
                                            {message.content + (message.isStreaming ? '▍' : '')}
                                        </ReactMarkdown>

                                        {extractImageUrls(message.content).map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt="Generated Image"
                                                style={{ maxWidth: '100%', marginTop: '10px' }}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    // 如果消息是用户发送的
                                    <div className="user-content">
                                        {message.content}
                                    </div>
                                )}

                                {/* 复制按钮 */}
                                <button
                                    style={{
                                        backgroundColor: 'black', // 设置背景颜色
                                        color: 'white', // 设置文字颜色
                                        border: 'none', // 去除边框
                                        borderRadius: '4px', // 设置边框圆角
                                        padding: '8px 16px', // 设置内边距
                                        cursor: 'pointer', // 设置鼠标指针样式
                                    }}
                                    className="copy-button"
                                    onClick={() => handleCopyMessage(message.content)}
                                >
                                    复制信息
                                </button>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div className="input-container">
                    {/* 图片和文件上传部分 */}
                    <div className="upload-section">

                        {/* 图片上传按钮 */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={(e) => handleImageUpload(e, setIsLoading, setImageUrls)}
                            style={{ display: 'none' }}
                            multiple
                        />
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            className="upload-button"
                        >
                            📷 上传图片
                        </button>

                        {/* 显示已上传的图片预览 */}
                        {imageUrls.map((url, index) => (
                            <div key={index} className="image-preview">
                                <img
                                    src={url}
                                    alt="预览"
                                    style={{ maxHeight: 50, marginRight: 5 }}
                                />
                                <button
                                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                                    className="remove-button"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* 文件上传按钮 */}
                        <div className="file-upload-section">
                            <input
                                type="file"
                                ref={fileInputRef}
                                multiple
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="upload-button"
                            >
                                📎 Attach Files
                            </button>

                            {files.map((file, index) => (
                                <span key={index} className="file-tag">
                                    {file.name}
                                    <button
                                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 用户文本输入框*/}
                    <div className="text-input">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}

                            placeholder="Type your message..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatDialog;