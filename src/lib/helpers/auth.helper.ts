import { NODE_ENV } from "../../config";

export const isDevEnv = (): boolean => NODE_ENV === "development";
