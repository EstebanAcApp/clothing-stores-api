import { type Response } from "express";

export function setAuthCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
    });
}