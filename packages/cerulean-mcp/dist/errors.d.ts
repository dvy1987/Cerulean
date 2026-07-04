export declare class CeruleanApiError extends Error {
    statusCode?: number | undefined;
    responseBody?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, responseBody?: unknown | undefined);
}
export declare function toUserFriendlyError(err: unknown): string;
