import { RequestHandler } from "express";
import { getAppMetaData } from "../lib/helpers/app.helper";

export const addAppMetaHeaders :RequestHandler = (req, res, next) => {
    const { xVersionHeaderValue , name } = getAppMetaData();
    res.setHeader("X-MS-Name",name);
    res.setHeader("X-MS-Version", xVersionHeaderValue);
    next();
}