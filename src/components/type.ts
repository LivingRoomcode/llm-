export type Message = {
    id: string;
    content: string;
    isUser: boolean;
    files?: File[];
    isStreaming?: boolean;
    imageUrls?: string[]; // 图片URL数组用于显示URL
};

export type imageMessage = {
    id: string;
    content: string | {  // 支持字符串或对象格式
        text?: string;
        image_url?: {
            url: string;
            name?: string;
        };
        file_url?: string;
    };
    contentType: 'text' | 'image';  // 新增内容类型标识
    isUser: boolean;
    files?: File[];
    isStreaming?: boolean;
    imageUrls?: string[];
};

export type Conversation = {
    id: string;
    title: string;
    messages: Message[];
};

