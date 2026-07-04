/**
 * Standard shapes returned to the IDE AI — success or a clear error message.
 */
export type ToolResult = {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
};
export declare function success(data: unknown, summary?: string): ToolResult;
export declare function failure(message: string, details?: unknown): ToolResult;
