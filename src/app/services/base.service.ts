import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { getString, setString } from "@nativescript/core/application-settings";
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseConfig, IConfig } from '~/app/base-config';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { authTokenServiceBaseUrl } from "../constants/end-points";


@Injectable({
    providedIn: "root"
})
export class BaseService {
    config: IConfig;
    private refreshTokenInProgress = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private authTokenAPIUrl = `${authTokenServiceBaseUrl(this.baseConfig.ENV)}/auth`;

    constructor(
        protected http: HttpClient,
        protected baseConfig: BaseConfig,
    ) {
        this.config = this.baseConfig.current;
    }

    private refreshToken(): Observable<any> {
        let refreshToken = getString("refresh-token");
        if (!refreshToken) {
            // TODO
            refreshToken = getString('auth-token');
        }

        return this.http.post(`${this.authTokenAPIUrl}/refresh_token`, { token: refreshToken })
            .pipe(
                map((response: any) => {
                    const resultToken = response.data.token;
                    setString("auth-token", resultToken);
                    setString("refresh-token", resultToken); // Update refresh token if necessary
                    this.refreshTokenSubject.next(resultToken);
                    return resultToken;
                }),
                catchError((error: any) => {
                    this.refreshTokenSubject.next(null);
                    return throwError(error);
                })
            );
    }



    private addAuthorizationHeader(options: any): any {
        options = options || {};
        options.headers = options.headers || new HttpHeaders({
            "Content-Type": "application/json"
        });

        const token = getString("auth-token");
        if (token) {
            options.headers = options.headers.set('Authorization', `Bearer ${token}`);
        }

        return options;
    }

    private handleHttpError(error: HttpErrorResponse, requestFn: () => Observable<any>): Observable<any> {
        if (error.status === 401 && !this.refreshTokenInProgress) {
            this.refreshTokenInProgress = true;
            this.refreshTokenSubject.next(null);

            return this.refreshToken().pipe(
                switchMap(newToken => {
                    this.refreshTokenInProgress = false;
                    return requestFn();
                }),
                catchError(refreshError => {
                    this.refreshTokenInProgress = false;
                    return throwError(refreshError);
                })
            );
        } else {
            return throwError(error);
        }
    }

    protected get(
        url: string,
        options?: any

    ): Observable<any> {
        options = this.addAuthorizationHeader(options);

        return this.http.get(url, options).pipe(
            catchError(error => this.handleHttpError(error, () => this.get(url, options)))
        );
    }

    protected post(
        url: string,
        body: any,
        options?: any,

    ): Observable<any> {
        options = this.addAuthorizationHeader(options);

        return this.http.post(url, body, options).pipe(
            catchError(error => this.handleHttpError(error, () => this.post(url, body, options)))
        );
    }

    protected put(
        url: string = "",
        body: any,
        options?: any,
    ): Observable<any> {
        options = this.addAuthorizationHeader(options);

        return this.http.put(url, body, options).pipe(
            catchError(error => this.handleHttpError(error, () => this.put(url, body, options)))
        );
    }

    protected delete(
        url: string,
        body: any,
        options?: any,
    ): Observable<any> {
        options = this.addAuthorizationHeader(options);

        return this.http.delete(url, { ...options, body: body }).pipe(
            catchError(error => this.handleHttpError(error, () => this.delete(url, body, options)))
        );
    }

    protected patch(
        url: string,
        body: string,
        options?: any
    ): Observable<any> {
        options = this.addAuthorizationHeader(options);
        return this.http.patch(url, body, options).pipe(
            catchError(error => this.handleHttpError(error, () => this.patch(url, body, options)))
        );
    }

    // protected head(action: string = "", options?: any): Observable<any> {
    //     options = this.addAuthorizationHeader(options);
    //     const url = this.getUrl(action);

    //     return this.http.head(url, options).pipe(
    //         catchError(error => this.handleHttpError(error, () => this.head(action, options)))
    //     );
    // }
}
