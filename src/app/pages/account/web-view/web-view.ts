import { Component, ElementRef, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions as TNSRouterExtensions } from "@nativescript/angular";// "@nativescript/angular";
import * as indicator from "@nstudio/nativescript-loading-indicator";
import { BaseConfig, IConfig } from '../../../../app/base-config';
import { loaderOptions } from "../../../utils";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { NO_ERRORS_SCHEMA } from "@angular/core";

var loader = new indicator.LoadingIndicator();


@Component({
    moduleId: module.id,
    templateUrl: "web-view.html",
    standalone: true,
    imports: [NativeScriptCommonModule],
    schemas: [NO_ERRORS_SCHEMA]
})
export class WebViewComponent {
    public webViewSrc: string = "";
    public actionBarText: string = "QWIPO";
    config: IConfig;

    @ViewChild("myWebView", { static: false }) webViewRef: ElementRef;
    @ViewChild("urlField", { static: false }) urlFieldRef: ElementRef;

    constructor(protected baseConfig: BaseConfig,
        private routerExtensions: TNSRouterExtensions,
        protected route: ActivatedRoute) {
        this.config = this.baseConfig.current;
    }
    ngOnInit() {
        this.route.queryParams.subscribe(async (params: any) => {
            loaderOptions.message = "Loading....";
            loader.show(loaderOptions);
            let url = params.webUrl;
            if (params.srcId) {
                this.actionBarText = params.title || "";
                this.webViewSrc = params.longUrl ? params.longUrl : `${this.config.webUrl}${url}`;
            }
            else {
                this.webViewSrc = `${url}`;
            }
            loader.hide();
        });

    }

    goBack() {
        this.routerExtensions.backToPreviousPage();
    }
}
