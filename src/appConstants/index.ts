/**
 * Application-wide constants. 
 */

const constants = {
  HTTP_MSG_OK: 'OK',
  HTTP_MSG_UNAUTHORIZED: 'Unauthorized',
  HTTP_MSG_SOMETHING_WENT_WRONG: 'Something went wrong',
  HTTP_MSG_NOT_FOUND: 'Not Found',
  HTTP_MSG_BAD_REQUEST: 'Bad Request',
} as const;

export type AppConstantKey = keyof typeof constants;

const appConstants = {
  get(key: AppConstantKey): string {
    return constants[key];
  },
  all(): Record<AppConstantKey, string> {
    return { ...constants };
  },
};

export default appConstants;
export { constants };
