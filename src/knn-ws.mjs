import cors from 'cors';
import express from 'express';
import bodyparser from 'body-parser';
import assert from 'assert';
import STATUS from 'http-status';

import { ok, err } from 'cs544-js-utils';
import { knn } from 'prj1-sol';
import { uint8ArrayToB64, b64ToUint8Array } from 'prj2-sol';

import fs from 'fs';
import http from 'http';
import https from 'https';

export const DEFAULT_COUNT = 5;

/** Start KNN server.  If trainData is specified, then clear dao and load
 *  into db before starting server.  Return created express app
 *  (wrapped within a Result).
 *  Types described in knn-ws.d.ts
 */
export default async function serve(knnConfig, dao, data) {
    try {
        const app = express();
        app.locals.base = knnConfig.base;
        app.locals.dao = dao;
        app.locals.data = data;
        app.locals.k = knnConfig.k;

        if (data) {
            await dao.clear();
            for (const { features, label } of data) {
                await dao.add(new Uint8Array(features), false, label);
            }

        }

        setupRoutes(app);

        return ok(app);
    }
    catch (e) {
        return err(e.toString(), { code: 'INTERNAL' });
    }
}


function setupRoutes(app) {
    const base = app.locals.base;
    app.use(cors({ exposedHeaders: 'Location' }));
    app.use(express.json({ strict: false })); //false to allow string body
    app.get(`${base}/check`, dummyHandler(app));
    app.post(`${base}/images`, doPostImages(app));
    app.get(`${base}/images/:id`, doGetImages(app));

    //must be last
    app.use(do404(app));
    app.use(doErrors(app));
}


function doPostImages(app) {
    return async (req, res) => {
        const { dao, base } = app.locals;
        const images = req.body;
        try {
            // convert images base64 to Uint8Array
            const imagesUint8Array = b64ToUint8Array(images);
            // use add method from dao to add images to db
            const results = await dao.add(imagesUint8Array, false);
            const location = `${base}/images/${results.val}`;
            res.setHeader('Location', location);
            res.status(STATUS.OK).json({ id: results.val });

        } catch (error) {
            const mapped = mapResultErrors(error);
            res.status(mapped.status).json(mapped);
        }
    }
}

function doGetImages(app) {
    return async (req, res) => {
        const { dao, base } = app.locals;
        const id = req.params.id;
        try {
            const result = await dao.get(id);
            if (result.hasErrors) {
                res.status(STATUS.NOT_FOUND).json(result);
                return
            }
            const images = uint8ArrayToB64(result.val.features);
            res.status(STATUS.OK).json({ features: images, label: result.val.label });
        } catch (error) {
            const mapped = mapResultErrors(error);
            res.status(mapped.status).json(mapped);
        }
    }
}

//dummy handler to test initial routing and to use as a template
//for real handlers.  Remove on project completion.
function dummyHandler(app) {
    return (async function (req, res) {
        try {
            res.json({ status: 'TODO' });
        }
        catch (err) {
            const mapped = mapResultErrors(err);
            res.status(mapped.status).json(mapped);
        }
    });
}

//TODO: add real handlers


/** Handler to log current request URL on stderr and transfer control
 *  to next handler in handler chain.
 */
function doLogRequest(app) {
    return (function (req, res, next) {
        console.error(`${req.method} ${req.originalUrl}`);
        next();
    });
}

/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
    return async function (req, res) {
        const message = `${req.method} not supported for ${req.originalUrl}`;
        const result = {
            status: STATUS.NOT_FOUND,
            errors: [{ options: { code: 'NOT_FOUND' }, message, },],
        };
        res.status(404).json(result);
    };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
    return async function (err, req, res, next) {
        const message = err.message ?? err.toString();
        const result = {
            status: STATUS.INTERNAL_SERVER_ERROR,
            errors: [{ options: { code: 'INTERNAL' }, message }],
        };
        res.status(STATUS.INTERNAL_SERVER_ERROR).json(result);
        console.error(result.errors);
    };
}

/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP = {
    EXISTS: STATUS.CONFLICT,
    NOT_FOUND: STATUS.NOT_FOUND,
    AUTH: STATUS.UNAUTHORIZED,
    DB: STATUS.INTERNAL_SERVER_ERROR,
    INTERNAL: STATUS.INTERNAL_SERVER_ERROR,
}

/** Return first status corresponding to first options.code in
 *  errors, but SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(errors) {
    let status = null;
    for (const err of errors) {
        const errStatus = ERROR_MAP[err.options?.code];
        if (!status) status = errStatus;
        if (errStatus === STATUS.SERVER_ERROR) status = errStatus;
    }
    return status ?? STATUS.BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err) {
    const errors = err.errors ?? [{ message: err.message ?? err.toString() }];
    const status = getHttpStatus(errors);
    if (status === STATUS.INTERNAL_SERVER_ERROR) console.error(errors);
    return { status, errors, };
} 
